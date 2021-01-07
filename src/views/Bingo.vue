<template>
  <div>
    <overlay v-show="!tokenIsValid"></overlay>
    <div class="jumbotron text-center" style="margin-bottom:0px">
      <h1 style="font-weight: 900">FFN BINGO</h1>
      <small>{{ name }}</small>
    </div>
    <div
      @click="introOn = !introOn"
      class="well"
      :class="introOn ? 'well-custom' : 'well-custom-hidden'">
      <div>
        <div class="col-xs-offset-2 col-xs-8 text-center">
          <span style="font-weight: 600">RULES</span>
        </div>
        <div class="col-xs-2 text-right">
          <span
            class="glyphicon"
            :class="introOn ? 'glyphicon-menu-up' : 'glyphicon-menu-down'"
            ></span>
        </div>
      </div>
      <br>
      <ol>
        <li>
          <u><span v-text="Math.pow(this.$gridnum, 2)"></span></u>
          photos will be randomly selected.
        </li>
        <li>
          Mark off all numbers on at least <span class="ball">{{ win }}</span> lines.
        </li>
        <li>
          Wrong picutre doesn't count
        </li>
      </ol>
    </div>
    <div class="cont" :class="{container: !isMobile}">
      <div class="text-center">
        <div class="row" style="padding-bottom: 40px;">
          <div class="col-xs-6">
            <button
              class="btn btn-custom-shuffle"
              @click="shuffleSids()"
              v-show="!shuffleIsTimeout"
              >Shuffle</button>
          </div>
          <div class="col-xs-6" :class="{'col-xs-offset-3': shuffleIsTimeout}">
            <button
              class="btn btn-custom-claim"
              @click="verify()"
              >BINGO</button>
          </div>
        </div>
        <template v-for="(arr, idx1) in matrix">
          <div class='row row-centered' :key="'idx1'+idx1">
            <div
              v-for="(_, idx2) in arr"
              :key="'idx2'+idx2"
              class="col-xs-2 f"
              :style="{
                'background-image': 'url(' + cellImg(idx1, idx2) + ')',
                cursor: 'pointer',
              }"
              @click="toggle(idx1, idx2)"
            >
              <div
                class="name"
                :class="{xycenter: matrix[idx1][idx2]}"
              >
              {{ cellText(idx1, idx2) }}
              </div>
            </div>
          </div>
        </template>
        <div class='row'>
          <div class="col-xs-offset-3 col-xs-6" style="padding-top: 20px">
            <p class="label label-custom">LINES: {{ lineCount }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';
import Vue from 'vue';
import overlay from './Overlay.vue';
import hsdic from '../data';
import PRIZES from '../prize';

Vue.prototype.$gridnum = 5;

// generate nxn matrix
// https://stackoverflow.com/a/39242362/1105489
function genMatrix(n) {
  return Array.from({
    length: n,
  }, () => new Array(n).fill(0));
}

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

function getRandomSids() {
  const sids = getRandom(Object.keys(hsdic), Vue.prototype.$gridnum ** 2);
  localStorage.setItem('sids', sids);
  return sids;
}

function getSids() {
  let sids = localStorage.getItem('sids');
  if (sids) {
    sids = sids.split(',');
  } else {
    sids = getRandomSids();
  }
  return sids;
}

function getMatrix() {
  let matrix = localStorage.getItem('matrix');
  if (matrix) {
    matrix = JSON.parse(matrix);
  } else {
    matrix = genMatrix(Vue.prototype.$gridnum);
  }
  return matrix;
}

function collectTargetSids(sids, matrix) {
  let cnt = 0;
  const res = [];
  for (const arr of matrix) {
    for (const int of arr) {
      if (int === 1) {
        res.push(sids[cnt]);
      }
      cnt += 1;
    }
  }
  return res;
}

function getShuffleIsTimeout() {
  let shuffleIsTimeout;
  if (localStorage.getItem('name')) {
    shuffleIsTimeout = 1;
  } else {
    shuffleIsTimeout = localStorage.getItem('shuffleIsTimeout') ? 1 : 0;
  }
  return shuffleIsTimeout;
}

export default {
  name: 'Bingo',
  components: {
    overlay,
  },
  data: () => ({
    win: 3,
    matrix: getMatrix(),
    sids: getSids(),
    token: localStorage.getItem('token') || null,
    tokenIsValid: true,
    displayShuffleButton: true,
    introOn: true,
    prizes: PRIZES,
    name: localStorage.getItem('name') || null,
    shuffleIsTimeout: getShuffleIsTimeout(),
  }),
  beforeMount() {
    window.addEventListener('beforeunload', this.preventNav);
    this.$once('hook:beforeDestroy', () => {
      window.removeEventListener('beforeunload', this.preventNav);
    });
  },
  beforeRouteLeave() {
    this.preventNav();
  },
  mounted: function _() {
    const settings = {
      title: 'Input email address',
      input: 'email',
      inputLabel: 'Your FFN email address',
      inputPlaceholder: 'xxx@ffn.com',
      allowEscapeKey: false,
      allowOutsideClick: false,
      confirmButtonText: 'Join',
      preConfirm: (email) => {
        axios
          .get(`${this.$API_HOST}/token/${email}`)
          .then((response) => {
            console.log(response);
            if (response.data.sid) {
              this.token = email;
              localStorage.setItem('token', email);
              this.tokenIsValid = true;
              const { name } = response.data;
              this.name = name;
              localStorage.setItem('name', name);
              Swal.fire({
                icon: 'success',
                title: 'Welcome',
                text: `Hi, ${name}!`,
              });
              this.timeoutShuffle();
            } else {
              Swal.fire({ title: 'Error', text: 'Email not exist!' })
                .then(() => {
                  Swal.fire(settings);
                });
            }
          })
          .catch((error) => {
            Swal.fire({ title: 'Critical', text: error })
              .then(() => {
                Swal.fire(settings);
              });
          });
      },
    };
    if (!this.token) {
      Swal.fire(settings);
    }
  },
  computed: {
    lineCount() {
      const sums = Array(this.$gridnum * 2 + 2).fill(0);
      for (let r = 0; r < this.$gridnum; r++) {
        for (let c = 0; c < this.$gridnum; c++) {
          const val = this.matrix[r][c];
          sums[r] += val;
          sums[this.$gridnum + c] += val;
        }
        // diagonal
        sums[this.$gridnum * 2 + 0] += this.matrix[r][r];
        sums[this.$gridnum * 2 + 1] += this.matrix[r][this.$gridnum - r - 1];
      }

      let cnt = 0;
      for (const sum of sums) {
        if (sum === this.$gridnum) {
          cnt += 1;
        }
      }
      return cnt;
    },
    isMobile() {
      // https://stackoverflow.com/a/50342804/1105489
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
      }
      return false;
    },
  },
  methods: {
    /* eslint no-param-reassign: "error" */
    preventNav(event) {
      event.preventDefault();
      event.returnValue = '';
    },
    timeoutShuffle() {
      console.log('shuffle timer start');
      setTimeout(() => {
        this.shuffleIsTimeout = 1;
        localStorage.setItem('shuffleIsTimeout', 1);
      }, 60000);
    },
    shuffleSids() {
      localStorage.removeItem('matrix');
      this.sids = getRandomSids();
      this.matrix = getMatrix();
    },
    cellText(idx1, idx2) {
      return hsdic[this.sids[(idx1 * this.$gridnum) + idx2]].name;
    },
    cellImg(idx1, idx2) {
      return `https://lh3.googleusercontent.com/a-/${hsdic[this.sids[(idx1 * this.$gridnum) + idx2]].uri}`;
    },
    toggle(idx1, idx2) {
      Vue.set(this.matrix[idx1], idx2, 1 - this.matrix[idx1][idx2]);
      localStorage.setItem('matrix', JSON.stringify(this.matrix));
    },
    verify() {
      if (this.lineCount < this.win) {
        Swal.fire({
          icon: 'error',
          title: 'Not yet',
          text: `Please mark off numbers on at least "${this.win}" lines`,
        });
        return;
      }
      axios
        .post(`${this.$API_HOST}/api`, { // TODO
          sids: collectTargetSids(this.sids, this.matrix),
          token: this.token,
        })
        .then((response) => {
          if (response.data.status) {
            if ((response.data.rank + 1) <= this.prizes.length) {
              Swal.fire({
                icon: 'success',
                title: 'CONGRATS!!',
                text: `You just won $ ${this.prizes[response.data.rank].toLocaleString()}!`,
                background: 'rgba(255,255,255,0.7)',
                backdrop: 'url("https://media.giphy.com/media/5T06ftQWtCMy0XFaaI/giphy.gif")',
                allowEscapeKey: false,
                allowOutsideClick: false,
                showConfirmButton: false,
              });
            } else {
              Swal.fire({
                icon: 'warning',
                title: 'YOU LOSE',
                text: 'Too late, you missed the prize...',
                background: 'rgba(0,0,0,0.7)',
                backdrop: 'url("https://media.giphy.com/media/3oEjHB1EKuujDjYFWw/giphy.gif")',
                allowEscapeKey: false,
                allowOutsideClick: false,
                showConfirmButton: false,
              });
            }
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Wait a minute!',
              text: 'You result dosen\'t look right, please check again!',
            });
          }
        })
        .catch((error) => {
          Swal.fire({ title: 'Critical', text: error });
        });
    },
  },
};

</script>

<style scoped lang="scss">
.well-custom {
  background-color: rgba(255, 255, 255, 0.6);
  border: 0;
  font-size: 0.9em;
  padding: 7px;
  max-height: 80px;
  transition: max-height 0.15s ease-out;
}
.well-custom-hidden {
  @extend .well-custom;
  max-height: 26px;
  overflow: hidden;
  transition: max-height 0.25s ease-in;
}
@mixin btn-custom($bg, $shadow) {
  width: 100%;
  padding: 1rem;
  border-radius: 1.5rem;
  background-color: $bg;
  color: #000;
  transition: all .5s ease 0s;
  box-shadow: 0 10px $shadow;
};
@mixin btn-custom-active($shadow) {
  &:active {
    box-shadow: 0 5px $shadow;
    transform: translateY(5px);
  }
}
.btn-custom-claim {
  @include btn-custom(#f6e58d, #f9ca24)
}
.btn-custom-claim:active {
  @include btn-custom-active(#f0932b)
}
.btn-custom-shuffle {
  @include btn-custom(#ffa07a, #fa8072)
}
.btn-custom-shuffle:active {
  @include btn-custom-active(#cd5c5c)
}

</style>
