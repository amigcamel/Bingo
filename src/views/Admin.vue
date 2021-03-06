<template>
  <div>
    <countdown ref="countdownRef" v-show="countdownIsRunning"></countdown>
    <div class="cr" @click="showQr()">QR Code</div>
    <div class="container" style="padding-top: 10px" v-if="isAuth">
     <div class="row">
       <div class="col-lg-6 col-md-6">
         <div
           v-if="Object.keys(target).length"
           class="text-center"
           >
           <img :src="target.url" height="500px">
           <div class="name2">{{ `${target.sid.slice(1)} ${target.name}` }}</div>
         </div>
         <div class="row" style="padding-top: 15px;">
           <div
             class="col-lg-3 col-md-3 text-center"
             v-for="(sid, index) in displaySids.slice(1)"
             :key="index">
             <img :src="getDisplayImg(sid)" height="150">
           </div>
         </div>
       </div>
       <div class="col-lg-6 col-md-6">
         <div class="jumbotron text-center countdown-box">
           <p>countdown</p>
           <h1>{{ countdown }}</h1>
           <p>seconds</p>
         </div>
         <div class="row text-center">
           <div class="col-lg-8 col-md-8 text-left">
             <button
               class="btn btn-default"
               @click="start()"
               :disabled="isCounting || isPause || isEnd"
               ><i class="glyphicon glyphicon-play"></i> Start</button>
             <button
               class="btn btn-default"
               @click="pause()"
               :disabled="!isCounting"
               v-show="!isPause"
               ><i class="glyphicon glyphicon-pause"></i> Pause</button>
             <button
               class="btn btn-default"
               @click="resume()"
               v-show="isPause"
               ><i class="glyphicon glyphicon-repeat"></i> Resume</button>
             <button
               class="btn btn-default"
               @click="reset()"
               ><i class="glyphicon glyphicon-step-backward"></i>Reset</button>
           </div>
           <div class="col-lg-4 col-md-4">
             <div class="input-group">
               <span class="input-group-addon">Timer</span>
               <input
                 type="number"
                 class="form-control"
                 max="20" min="3"
                 onKeyDown="return false"
                 :disabled="isCounting"
                 v-model.number="defaultCountdown"
                 >
               <span class="input-group-addon">sec</span>
             </div>
           </div>
         </div>
         <table class="table table-striped" style="margin-left: 10px;">
           <caption class="winner-caption">WINNERS</caption>
           <thead>
             <tr>
               <th>#</th>
               <th>Name</th>
               <th>Time</th>
               <th>Prize</th>
             </tr>
           </thead>
           <tbody>
             <tr v-for="(prize, idx) in prizes" :key="idx" class="winner">
               <td>{{ idx+1 }}</td>
               <td>
                 <img :src="getWinnerImg(idx)" width="40" style="border-radius:50%">
                 <span class="badge badge-custom">{{ getWinnerSid(idx) }}</span>
                 <span>{{ getWinnerName(idx) }}</span>
               </td>
               <td>{{ getWinnerTime(idx) }}</td>
               <td>{{ getWinnerPrize(idx) }}</td>
             </tr>
           </tbody>
         </table>
       </div>
     </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';
import moment from 'moment';
import sha256 from 'crypto-js/sha256';
import HSDIC from '../data';
import PRIZES from '../prize';
import applause from '../assets/applause.mp3';
import ding from '../assets/ding.mp3';
import restaurant from '../assets/restaurant.mp3';
import bell from '../assets/bell.mp3';
import countdown from './Countdown.vue';
import unknown from '../assets/unknown.png';
import qrcode from '../assets/qrcode.png';

// A localStorage wrapper
function LS(name) {
  this.name = name;
}
LS.prototype.get = function _(defaultVal) {
  const name = localStorage.getItem(this.name);
  let res;
  if (name) {
    res = JSON.parse(name);
  } else {
    res = defaultVal;
  }
  return res;
};
LS.prototype.set = function _(val) {
  localStorage.setItem(this.name, JSON.stringify(val));
};
LS.prototype.remove = function _() {
  localStorage.removeItem(this.name);
};

function getRandom(arr, num) {
  // How to get a number of random elements from an array?
  // https://stackoverflow.com/a/19270021/1105489
  const result = new Array(num);
  let len = arr.length;
  const taken = new Array(len);
  if (num > len) throw new RangeError('getRandom: more elements taken than available');
  let n = num;
  while (n--) {
    const x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

function genDefaultDisplaySids() {
  return new Array((12 + 1)).fill(null);
}

function initRestaurantSound() {
  const audio = new Audio(restaurant);
  audio.loop = true;
  return audio;
}

export default {
  name: 'Admin',
  components: {
    countdown,
  },
  data: () => ({
    hsdic: HSDIC,
    prizes: PRIZES,
    sids: Object.keys(HSDIC),
    winners: [],
    targetSids: [],
    displaySids: genDefaultDisplaySids(),
    defaultCountdown: 8,
    countdown: 8,
    isCounting: new LS('isCounting').get(false),
    isPause: new LS('isPause').get(false),
    isEnd: new LS('isEnd').get(false),
    target: {},
    timeouts: [],
    dingSound: new Audio(ding),
    ws: null,
    applauseSound: new Audio(applause),
    restaurantSound: initRestaurantSound(),
    bellSound: new Audio(bell),
    countdownIsRunning: null,
    isAuth: false,
  }),
  mounted: function _() {
    // simple auth
    this.auth();

    // check winners
    this.getWinners();

    // randomly display images
    this.randomDisplay();

    // sync targetSids and winners
    axios
      .get(`${this.$API_HOST}/targetsids`)
      .then((response) => {
        if (response.data.targetSids.length !== 0) {
          this.targetSids = response.data.targetSids;
          for (const sid of this.targetSids.reverse()) {
            const idx = this.sids.indexOf(sid);
            this.sids.splice(idx, 1);

            this.displaySids.pop();
            this.displaySids.unshift(sid);

            this.target = this.composeTarget(this.displaySids[0]);
          }
        }
      });
    axios
      .get(`${this.$API_HOST}/winners`)
      .then((response) => {
        console.log(response.data);
        if (response.data.winners !== null) { // TODO: response inconsistent with targetsids
          this.winners = response.data.winners.slice().reverse();
        }
      });
  },
  created() {
    this.initWS();
  },
  destroyed() {
    this.ws.close();
  },
  methods: {
    initWS() {
      const uri = `${this.$WS_ORIGIN}`;
      this.ws = new WebSocket(uri);
      this.ws.onmessage = this.wsOnmessage;
      this.ws.onopen = this.wsOnopen;
      this.ws.onerror = this.wsOnerror;
      this.ws.onclose = this.wsClose;
    },
    wsOnmessage(event) {
      console.log('on message');
      if (JSON.parse(event.data).update === 1) {
        this.getWinners();
      }
    },
    wsOnopen() {
      console.log('on open');
    },
    wsOnerror() {
      console.log('on error');
    },
    wsClose() {
      console.log('on close');
    },
    toTST(unixTime) {
      return moment.unix(unixTime * 0.001).format('HH:mm:ss.SSS');
    },
    auth() {
      Swal.fire({
        inputLabel: 'PASSWORD',
        input: 'password',
        confirmButtonText: 'Verify',
        preConfirm: (password) => {
          if (sha256(password).toString() !== 'cad0a69724f26c147d1a1c970a2ed32d9a000912598a668cb457dbef2cf43f03') {
            this.auth();
          } else {
            this.isAuth = true;
          }
        },
      });
    },
    getWinners() {
      axios
        .get(`${this.$API_HOST}/winners`)
        .then((response) => {
          if (response.data.winners) {
            this.winners = response.data.winners.slice().reverse();
          } else {
            this.winners = [];
          }
        })
        .catch((error) => {
          Swal.fire({ title: 'Critical', text: error });
        });
    },
    getDisplayImg(sid) {
      let img;
      if (sid) {
        img = `https://lh3.googleusercontent.com/a-/${this.hsdic[sid].uri}=s96`;
      } else {
        img = unknown;
      }
      return img;
    },
    getWinnerSid(idx) {
      const item = this.winners[idx];
      let output;
      if (item) {
        output = item[0].slice(1);
      } else {
        output = '';
      }
      return output;
    },
    getWinnerImg(idx) {
      let img;
      const item = this.winners[idx];
      if (item) {
        img = `https://lh3.googleusercontent.com/a-/${this.hsdic[item[0]].uri}`;
      } else {
        img = unknown;
      }
      return img;
    },
    getWinnerName(idx) {
      let name;
      const item = this.winners[idx];
      if (item) {
        name = this.hsdic[item[0]].name;
      } else {
        name = '';
      }
      return name;
    },
    getWinnerTime(idx) {
      let time;
      const item = this.winners[idx];
      if (item) {
        time = this.toTST(item[1]);
      } else {
        time = '';
      }
      return time;
    },
    getWinnerPrize(idx) {
      let prize;
      const item = this.winners[idx];
      if (item) {
        prize = `$ ${this.prizes[idx].toLocaleString()}`;
      } else {
        prize = '$ ???';
      }
      return prize;
    },
    getRandomSid() {
      const sid = getRandom(this.sids, 1)[0];
      return sid;
    },
    randomDisplay() {
      const intv = setInterval(() => {
        if (!Object.keys(this.targetSids).length && !this.isCounting) {
          const sid = this.getRandomSid();
          this.target = this.composeTarget(sid);
        } else {
          clearInterval(intv);
        }
      }, 1000);
    },
    composeTarget(sid) {
      const { name } = this.hsdic[sid];
      const url = `https://lh3.googleusercontent.com/a-/${this.hsdic[sid].uri}=s500`;
      return { sid, name, url };
    },
    removeOneSid() {
      // pop a sid from this.sids and set target
      const sid = this.getRandomSid();
      const idx = this.sids.indexOf(sid);
      this.sids.splice(idx, 1);
      this.target = this.composeTarget(sid);
      this.targetSids.unshift(sid);

      this.displaySids.pop();
      this.displaySids.unshift(sid);

      axios
        .put(`${this.$API_HOST}/targetsids`, {
          sid,
        })
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          Swal.fire({ title: 'Critical', text: error });
          this.pause();
        });
    },
    start() {
      const wait = this.$store.state.countdownDuration + 1500;
      this.restaurantSound.play();
      this.countdownIsRunning = true;
      this.$refs.countdownRef.startCountdown();

      // play "GO" sound
      setTimeout(() => {
        this.bellSound.play();
      }, this.$store.state.countdownDuration);

      // start countdown
      setTimeout(() => {
        this.removeOneSid();
        this.countdownIsRunning = false;
        this.isCounting = true;
        this.countdown--;
      }, wait);
    },
    resume() {
      this.isCounting = true;
      this.isPause = false;
      this.restaurantSound.play();
      setTimeout(() => {
        this.countdown--;
      }, 1000);
    },
    pause() {
      this.isCounting = false;
      this.isPause = true;
      this.restaurantSound.pause();
    },
    reset() {
      if (this.isCounting) {
        this.pause();
      }
      Swal.fire({
        title: 'Reset',
        text: 'Are you sure?',
        showCancelButton: true,
      }).then((result) => {
        if (result.value) {
          // reset states
          this.isCounting = false;
          this.isPause = false;
          this.isEnd = false;
          this.countdown = this.defaultCountdown;
          this.sids = Object.keys(this.hsdic);
          this.displaySids = genDefaultDisplaySids();
          this.target = {};
          this.targetSids = [];
          this.winners = [];

          // delete targetSids
          axios
            .delete(`${this.$API_HOST}/targetsids`)
            .then((response) => {
              console.log(response);
            })
            .catch((error) => {
              Swal.fire({ title: 'Critical', text: error });
            });

          // delete winners
          axios
            .delete(`${this.$API_HOST}/winners`)
            .then((response) => {
              console.log(response);
            })
            .catch((error) => {
              Swal.fire({ title: 'Critical', text: error });
            });

          // display random pics
          this.randomDisplay();

          // reset timer
          if (this.$refs.countdownRef.timer) {
            this.$refs.countdownRef.resetCountdown();
          }

          // reset music
          this.restaurantSound = initRestaurantSound();
        }
      });
    },
    showQr() {
      Swal.fire({
        imageUrl: qrcode,
        imageHeight: '510',
        imageAlt: 'https://bingo.ffntea.club',
        text: 'https://bingo.ffntea.club',
        showConfirmButton: false,
      });
    },
  },
  watch: {
    defaultCountdown(val) {
      console.log(val);
      this.countdown = val;
    },
    countdown(val) {
      // play ding sound
      if (val === this.defaultCountdown) {
        this.dingSound.play();
      }
      if (val > 0) {
        setTimeout(() => {
          if (this.isCounting) {
            if (val === 1) {
              this.countdown = this.defaultCountdown + 1;
              if (this.sids.length === 0) {
                this.isCounting = false;
                this.isPause = false;
                this.isEnd = true;
                Swal.fire('END!');
                this.restaurantSound.pause();
                return;
              }
              this.removeOneSid();
            }
            this.countdown--;
          }
        }, 1000);
      }
    },
    isCounting(val) {
      new LS('isCounting').set(val);
    },
    isPause(val) {
      new LS('isPause').set(val);
    },
    isEnd(val) {
      new LS('isEnd').set(val);
    },
    winners(val) {
      if (val.length <= this.prizes.length) {
        this.applauseSound.play();
      }
    },
  },
};
</script>

<style scoped lang="scss">
.countdown-box {
 padding-top:10px;
 padding-bottom:10px;
 margin-bottom:0px;
}
.countdown-box h1 {
  margin: 10px 0px 10px 0px;
}
.winner-caption {
  text-align: center;
  font-size: 30px;
}
.btn {
  width: 90px;
}
</style>
