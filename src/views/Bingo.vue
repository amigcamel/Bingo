<template>
  <div>
    <div id="overlay" v-show="!tokenIsValid"></div>
    <div class="jumbotron text-center">
      <h1>大頭賓果</h1>
      <h2>遊戲規則</h2>
      <p>系統會從所有員工大頭照中隨機選出<span v-text="Math.pow(this.$gridnum, 2)"></span>張<br>
         凡連線數達<span class="ball">{{ win }}</span>條者<br>即可獲得「現金大禮」
      </p>
    </div>
    <div class="cont" :class="{container: !isMobile}">
      <div class="text-center">
        <div class='row'>
          <div class="col-xs-offset-3 col-xs-6">
            <p class="alert">連線數： {{ lineCount }}</p>
          </div>
        </div>
        <div class="row" style="padding-bottom: 40px;">
          <button
            class="btn btn-info btn-lg"
            @click="shuffleSids()"
            :disabled="isStarted"
            >Shuffle</button>
          <button
            class="btn btn-warning btn-lg"
            @click="startGame()"
            :disabled="isStarted"
            >Start</button>
          <button
            class="btn btn-danger btn-lg"
            :disabled="lineCount < win"
            @click="verify()"
            >Verify</button>
        </div>
        <template v-for="(arr, idx1) in matrix">
          <div class='row row-centered' :key="'idx1'+idx1">
            <div
              v-for="(_, idx2) in arr"
              :key="'idx2'+idx2"
              class="col-xs-2 f"
              :style="{
                'background-image': 'url(' + cellImg(idx1, idx2) + ')',
                cursor: (isStarted ? 'pointer' : 'default')
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
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';
import Vue from 'vue';
import hsdic from '../data';

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

export default {
  name: 'Bingo',
  data: () => ({
    win: 3,
    matrix: getMatrix(),
    sids: getSids(),
    isStarted: localStorage.getItem('isStarted') || false,
    token: new URLSearchParams(window.location.search).get('token'),
    tokenIsValid: null,
  }),
  mounted: function _() {
    if (!this.token) {
      this.tokenIsValid = false;
      alert('Invalid token!');
      return;
    }
    axios
      .get(`${this.$API_HOST}/token/${this.token}`)
      .then((response) => {
        console.log(response);
        if (response.data.status) {
          this.tokenIsValid = true;
        } else {
          alert('Invalid token!');
          this.tokenIsValid = false;
        }
      })
      .catch((error) => {
        Swal.fire({ title: 'Critical', text: error });
      });
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
    shuffleSids() {
      this.sids = getRandomSids();
    },
    cellText(idx1, idx2) {
      return hsdic[this.sids[(idx1 * this.$gridnum) + idx2]].name;
    },
    cellImg(idx1, idx2) {
      return `https://lh3.googleusercontent.com/a-/${hsdic[this.sids[(idx1 * this.$gridnum) + idx2]].uri}`;
    },
    toggle(idx1, idx2) {
      if (this.isStarted) {
        Vue.set(this.matrix[idx1], idx2, 1 - this.matrix[idx1][idx2]);
        localStorage.setItem('matrix', JSON.stringify(this.matrix));
      }
    },
    startGame() {
      Swal.fire({
        title: 'Bingo',
        text: 'Start playing?',
        showCancelButton: true,
      }).then((result) => {
        if (result.value) {
          console.log(result.value);
          localStorage.setItem('isStarted', 1);
          this.isStarted = true;
        }
      });
    },
    verify() {
      Swal.fire({
        title: 'Verify Result',
        text: 'If you want to verify your result, please click OK.',
        showCancelButton: true,
      }).then((result) => {
        if (result.value) {
          axios
            .post(`${this.$API_HOST}/api`, { // TODO
              sids: collectTargetSids(this.sids, this.matrix),
              token: this.token,
            })
            .then((response) => {
              let title; let
                text;
              if (response.data.status) {
                title = 'Congrats!';
                text = 'You just won the prize!';
              } else {
                title = 'Wait a minute!';
                text = 'You result dosen\'t look right, please check again!';
              }
              Swal.fire({ title, text });
            })
            .catch((error) => {
              Swal.fire({ title: 'Critical', text: error });
            });
        }
      });
    },
  },
};

</script>
