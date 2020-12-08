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

var app = new Vue({
  el: '.cont',
  data: {
    matrix: genMatrix(5),
    sids: getRandom(Object.keys(hsdic), 5 * 5),
  },
  computed: {
    lineCount: function() {
      const sums = Array(5 * 2 + 2).fill(0);
      for (let r=0; r < 5; r++) {
        for (let c=0; c < 5; c++) {
          let val = this.matrix[r][c];
          sums[r] += val;
          sums[5 + c] += val;
        }
        // diagonal
        sums[5 * 2 + 0] += this.matrix[r][r];
        sums[5 * 2 + 1] += this.matrix[r][5 - r - 1]
      }

      let cnt = 0;
      for (let sum of sums) {
        if (sum == 5) {
          cnt += 1;
        }
      }
      return cnt;
    }
  },
  methods: {
    cellText: function(idx1, idx2) {
      return this.sids[(idx1 * 5) + idx2]
    },
    cellImg: function(idx1, idx2) {
      return "https://lh3.googleusercontent.com/a-/" + hsdic[this.sids[(idx1 * 5) + idx2]]
    },
    toggle: function(idx1, idx2) {
      Vue.set(this.matrix[idx1], idx2, 1 - this.matrix[idx1][idx2]);
    },
  }
})
