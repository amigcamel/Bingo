const API_HOST = 'http://127.0.0.1:8000';

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

function getMatrix() {
  let matrix = localStorage.getItem("matrix");
  if (matrix) {
    matrix = JSON.parse(matrix);
  } else {
    matrix = genMatrix(Vue.prototype.$gridnum);
  }
  return matrix
}

function collectTargetSids(sids, matrix) {
  let cnt = 0;
  const res = [];
  for (let arr of matrix) {
    for (let int of arr) {
      if (int === 1) {
        res.push(sids[cnt]);
      }
      cnt += 1;
    }
  }
  return res;
}

Vue.prototype.$gridnum = 5;

var app = new Vue({
  el: '#app',
  data: {
    win: 3,
    matrix: getMatrix(),
    sids: getSids(),
    isStarted: localStorage.getItem("isStarted") || false,
    token: new URLSearchParams(window.location.search).get('token'),
    tokenIsValid: null,
  },
  mounted: function() {
    if (!this.token) {
      this.tokenIsValid = false;
      alert('Invalid token!')
      return;
    }
    axios
      .get(`${API_HOST}/token/${this.token}`)
      .then((response) => {
        console.log(response)
        if (response.data.status) {
          this.tokenIsValid = true;   
        } else {
          alert('Invalid token!')
          this.tokenIsValid = false;   
        }
      })
      .catch((error) => {
        Swal.fire({title: 'Critical', text: error});
      })
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
        localStorage.setItem("matrix", JSON.stringify(this.matrix));
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
            .post(`${API_HOST}/api`, {  // TODO
              sids: collectTargetSids(this.sids, this.matrix),
              token: this.token,
            })
            .then((response) => {
              let title, text;
              if (response.data.status) {
                title = "Congrats!";
                text = "You just won the prize!";
              } else {
                title = "Wait a minute!";
                text = "You result dosen't look right, please check again!";
              }
              Swal.fire({title: title, text: text});
            })
            .catch((error) => {
              Swal.fire(`Can't connect to the server`);
            })
        }
      });
    },
  }
})
