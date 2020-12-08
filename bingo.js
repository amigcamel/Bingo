// generate nxn matrix
// https://stackoverflow.com/a/39242362/1105489
function genMatrix(n) {
  return Array.from({
    length: n
  }, () => new Array(n).fill(0));
};

function getRandom(arr, n) {
  // How to get a number of random elements from an array?
  // https://stackoverflow.com/a/19270021/1105489
  var result = new Array(n),
     len = arr.length,
     taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}


Vue.prototype.$gridnum = 5;

var app = new Vue({
  el: '#app',
  data: {
    win: 5,
    matrix: genMatrix(Vue.prototype.$gridnum),
    sids: getRandom(Object.keys(hsdic), Math.pow(Vue.prototype.$gridnum, 2)),
  },
  computed: {
    lineCount: function() {
      const sums = Array(this.$gridnum * 2 + 2).fill(0);
      for (let r=0; r < this.$gridnum; r++) {
        for (let c=0; c < this.$gridnum; c++) {
          let val = this.matrix[r][c];
          sums[r] += val;
          sums[this.$gridnum + c] += val;
        }
        // diagonal
        sums[this.$gridnum * 2 + 0] += this.matrix[r][r];
        sums[this.$gridnum * 2 + 1] += this.matrix[r][this.$gridnum - r - 1]
      }

      let cnt = 0;
      for (let sum of sums) {
        if (sum == this.$gridnum) {
          cnt += 1;
        }
      }
      return cnt;
    }
  },
  methods: {
    cellText: function(idx1, idx2) {
      return this.sids[(idx1 * this.$gridnum) + idx2]
    },
    cellImg: function(idx1, idx2) {
      return "https://lh3.googleusercontent.com/a-/" + hsdic[this.sids[(idx1 * this.$gridnum) + idx2]]
    },
    toggle: function(idx1, idx2) {
      Vue.set(this.matrix[idx1], idx2, 1 - this.matrix[idx1][idx2]);
    },
    isMobile: function() {
      // https://stackoverflow.com/a/50342804/1105489
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true
      } else {
        return false
      }
    },
  }
})
