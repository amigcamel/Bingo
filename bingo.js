// http://stackoverflow.com/a/881147/1105489
String.prototype.count=function(s1) { 
    return (this.length - this.replace(new RegExp(s1,"g"), '').length) / s1.length;
}

rows = ['a', 'b', 'c', 'd', 'e']
cols = ['1', '2', '3', '4', '5']
d1 = rows.map(function (e, i) {
	return [rows[i]+cols[i]];
});
cols.reverse()
d2 = rows.map(function (e, i) {
	return [rows[i]+cols[i]];
});

function cal() {
	var flags = '',
		lines = 0;
	$('.sel').each(function() {
		flags += $(this).attr('id');
	});
	$.each([rows, cols], function(i, a) {
		$.each(a, function(ii, f) {
			if (flags.count(f) == 5) {
				lines += 1;
			}
		})
	})
	$.each([d1, d2], function(i, e) {
		dl = 0;
		$.each(e, function(ii, c) {
			if (flags.indexOf(c) == -1) {
				dl += -1
			}
		})
		if (dl == 0) {
			lines += 1
		}
	})
	$('#lines').text(lines);
}

$(function () {
	$('body').on('touchstart click', '.f', function(e) {
		e.preventDefault();
		$(this).toggleClass('sel');
		cal();
	});
})

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
    prefixes: ['a', 'b', 'c', 'd', 'e'],
    numbers: [1, 2, 3, 4, 5],
    sids: getRandom(Object.keys(hsdic), 25),
  },
  methods: {
    cellText: function(idx1, idx2) {
      return this.sids[(idx1 * 5) + idx2]
    },
    cellImg: function(idx1, idx2) {
      return "https://lh3.googleusercontent.com/a-/" + hsdic[this.sids[(idx1 * 5) + idx2]]
    },
  }
})
