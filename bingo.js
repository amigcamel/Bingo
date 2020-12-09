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

function getRandomSids() {
  const sids = getRandom(Object.keys(hsdic), Math.pow(Vue.prototype.$gridnum, 2));
  localStorage.setItem("sids", sids);
  return sids;
}


function getSids() {
  let sids = localStorage.getItem("sids");
  if (sids) {
    sids = sids.split(",");
  } else {
    sids = getRandomSids();
  }
  return sids;
}


Vue.prototype.$gridnum = 5;

var app = new Vue({
  el: '#app',
  data: {
    win: 5,
    matrix: genMatrix(Vue.prototype.$gridnum),
    sids: getSids(),
    isStarted: localStorage.getItem("isStarted") || false,
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
    },
    isMobile: function() {
      // https://stackoverflow.com/a/50342804/1105489
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true
      } else {
        return false
      }
    },
  },
  methods: {
    shuffleSids: function() {
      this.sids = getRandomSids();
    },
    cellText: function(idx1, idx2) {
      return hsdic[this.sids[(idx1 * this.$gridnum) + idx2]].name
    },
    cellImg: function(idx1, idx2) {
      return "https://lh3.googleusercontent.com/a-/" + hsdic[this.sids[(idx1 * this.$gridnum) + idx2]].uri
    },
    toggle: function(idx1, idx2) {
      if (this.isStarted) {
        Vue.set(this.matrix[idx1], idx2, 1 - this.matrix[idx1][idx2]);
      }
    },
    startGame: function() {
      Swal.fire({
        title: "Bingo",
        text: "Start playing?",
        showCancelButton: true
      }).then((result) => {
        if (result.value) {
          console.log(result.value)
          localStorage.setItem("isStarted", 1);
          this.isStarted = true;
        }
      });
    },
    verify: function() {
      Swal.fire({
        title: "Verify Result",
        text: "If you want to verify your result, please click OK.",
        showCancelButton: true,
      }).then((result) => {
        if (result.value) {
          axios
            .post("http://localhost:8000/api", {  // TODO
              sids: this.sids,
              matrix: this.matrix,
              token: this.token || "fake-token",  // TODO
            })
            .then((response) => {
              console.log(response);
              Swal.fire(response.data.status);
            })
            .catch((error) => {
              Swal.fire(`Can't connect to the server`);
            })
        }
      });
    },
  }
})
