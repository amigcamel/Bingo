<template>
  <div>
    <countdown ref="countdownRef" v-show="countdownIsRunning"></countdown>
    <div class="container" style="padding-top: 60px">
     <div class="row">
       <div class="col-lg-6 col-md-6">
         <div
           v-if="Object.keys(target).length"
           class="text-center"
           >
           <img :src="target.url" height="500px">
           <div class="name2">{{ `${target.sid} ${target.name}` }}</div>
         </div>
         <div class="row">
           <div
             class="col-lg-2 col-md-2 text-center"
             v-for="(sid, index) in displaySids.slice(1)"
             :key="index">
             <img :src="getDisplayImg(sid)" height="96">
           </div>
         </div>
       </div>
       <div class="col-lg-6 col-md-6">
         <div class="jumbotron text-center">
           <h1>{{ countdown }}</h1>
         </div>
         <div class="row text-center">
           <div class="col-lg-6 col-md-6" v-show="!isCounting">
             <div class="input-group">
               <span class="input-group-addon">Countdown</span>
               <input
                 type="number"
                 class="form-control"
                 max="99" min="1"
                 v-model.number="defaultCountdown"
                 >
               <span class="input-group-addon">sec</span>
             </div>
           </div>
           <div
             class="col-lg-6 col-md-6"
             :class="{'col-lg-offset-6': isCounting, 'col-md-offset-6': isCounting}"
             >
             <button
               class="btn btn-info"
               @click="start()"
               :disabled="isCounting || isPause || isEnd"
               >Start</button>
             <button
               class="btn btn-info"
               @click="pause()"
               :disabled="!isCounting"
               v-show="!isPause"
               >Pause</button>
             <button
               class="btn btn-info"
               @click="resume()"
               v-show="isPause"
               >Resume</button>
             <button
               class="btn btn-danger"
               @click="reset()"
               >Reset</button>
           </div>
         </div>
         <h2>Winners</h2>
         <table class="table">
           <thead>
             <tr>
               <th>#</th>
               <th>Name</th>
               <th>Time</th>
               <th>Prize</th>
             </tr>
           </thead>
           <tbody>
             <tr v-for="(prize, idx) in prizes" :key="idx">
               <td>{{ idx+1 }}</td>
               <td>
                 <img :src="getWinnerImg(idx)" width="30px" style="border-radius:50%">
                 {{ getWinnerName(idx) }}
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
import HSDIC from '../data';
import PRIZES from '../prize';
import applause from '../assets/applause.mp3';
import ding from '../assets/ding.mp3';
import restaurant from '../assets/restaurant.mp3';
import bell from '../assets/bell.mp3';
import countdown from './Countdown.vue';
import unknown from '../assets/unknown.png';

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
  return new Array((18 + 1)).fill(null);
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
    restaurantSound: new Audio(restaurant),
    bellSound: new Audio(bell),
    countdownIsRunning: null,
  }),
  mounted: function _() {
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
      const uri = `${this.$WS_ORIGIN}/state`;
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
        this.applauseSound.play();
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
      return moment.unix(unixTime).format('HH:mm:ss');
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
      this.ws.send('countdown');
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
          this.restaurantSound = new Audio(restaurant);
        }
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
  },
};
</script>
