<template>
  <div>
    <div id="app" class="container" style="padding-top: 60px">
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
             v-for="(sid, index) in targetSids.slice(1, 13)"
             :key="index">
             <img :src="'https://lh3.googleusercontent.com/a-/' + hsdic[sid].uri + '=s96'" height="96">
             <div>{{ hsdic[sid].name.split(" ")[0] }}</div>
           </div>
         </div>
       </div>
       <div class="col-lg-6 col-md-6">
         <div class="jumbotron text-center">
           <h1>00:{{ ('00' + countdown).slice(-2) }}</h1>
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
               :disabled="isCounting || isPause"
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
               :disabled="!isCounting && !isPause"
               >Reset</button>
           </div>
         </div>
         <h2>Ranks</h2>
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
             <tr v-for="(item, idx) in winners" :key="idx">
               <td>{{ idx+1 }}</td>
               <td>
                 <img :src="'https://lh3.googleusercontent.com/a-/' + hsdic[item[0]].uri" width="30px" style="border-radius:50%">
                 {{ item[0] }}
               </td>
               <td>{{ toTST(item[1]) }}</td>
               <td>{{ prizes[idx] | prize }}</td>
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
import beep from '../assets/beep.mp3';
import applause from '../assets/applause.mp3';

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

export default {
  name: 'Admin',
  data: () => ({
    hsdic: HSDIC,
    prizes: PRIZES,
    sids: Object.keys(HSDIC),
    winners: [],
    targetSids: [],
    defaultCountdown: 8,
    countdown: 8,
    isCounting: false,
    isPause: false,
    target: {},
    timeouts: [],
    beepSound: new Audio(beep),
    ws: null,
    applauseSound: new Audio(applause),
  }),
  mounted: function _() {
    // check winners
    this.getWinners();

    // randomly display images
    this.randomDisplay();
  },
  created() {
    this.initWS();
  },
  destroyed() {
    this.ws.close();
  },
  filters: {
    prize: (value) => {
      if (value === undefined) {
        return 'Too late😢😢😢';
      }
      return `$${value.toLocaleString()} NTD`;
    },
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
      this.isCounting = true;
      this.target = {};
      this.removeOneSid();
      setTimeout(() => {
        this.countdown--;
      }, 1000);
    },
    resume() {
      this.isCounting = true;
      this.isPause = false;
      setTimeout(() => {
        this.countdown--;
      }, 1000);
    },
    pause() {
      this.isCounting = false;
      this.isPause = true;
    },
    reset() {
      this.pause();
      Swal.fire({
        title: 'Reset',
        text: 'Are you sure?',
        showCancelButton: true,
      }).then((result) => {
        if (result.value) {
          this.isCounting = false;
          this.isPause = false;
          this.countdown = this.defaultCountdown;
          this.sids = Object.keys(this.hsdic);
          this.target = {};
          this.targetSids = [];
          axios
            .delete(`${this.$API_HOST}/targetsids`)
            .then((response) => {
              console.log(response);
            })
            .catch((error) => {
              Swal.fire({ title: 'Critical', text: error });
            });
          this.randomDisplay();
        } else {
          this.resume();
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
      // play beep sound
      if (val <= 5) {
        this.beepSound.play();
      }
      if (val > 0) {
        setTimeout(() => {
          if (this.isCounting) {
            if (val === 1) {
              this.countdown = this.defaultCountdown + 1;
              if (this.sids.length === 0) {
                this.isCounting = false;
                this.isPause = false;
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
  },
};
</script>
