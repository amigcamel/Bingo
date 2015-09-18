function shuffle(array) {
	var currentIndex = array.length,
	temporaryValue, randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

function gen_nums() {
	nums = []
	for (var n = 1; n < 75; n++) {
		nums.push(n)
	}
	nums = shuffle(nums)
	$('.f').each(function (i) {
		$(this).text(nums[i])
	})
}

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
	gen_nums();
	$('body').on('touchstart click', '.f', function(e) {
		e.preventDefault();
		$(this).toggleClass('sel');
		cal();
	});
	 setTimeout(function() {
	 	$('#joke').removeClass('hide');
	 }, 5000);
	$('.container').on('touchstart click', '#joke', function(e) {
		e.preventDefault();/
		tits = ['你確定', '想太多了'];
		msgs = ['<h3>真的要放棄了嗎？</h3>', '<h3>哪有這麼好康的事情 = = </h3>'];
		oks = ['我要放棄', '我錯了>"<'];
		cns = ['不，我有運動家的精神', '關閉'];

        for(var i = 1; i >=0; i--) {
            var dialog = new BootstrapDialog({
            	type: BootstrapDialog.TYPE_DANGER,
                title: tits[i],
                message: msgs[i],
                buttons: [{
                    label: cns[i],
                    action: function(){
                        $.each(BootstrapDialog.dialogs, function(id, dialog){
                            dialog.close();
                        });
                    }
                }, {
                    cssClass: 'btn-warning',
                    label: oks[i],
                    action: function(dialogRef){
                        dialogRef.close();
                    }
                }]
            });
            dialog.open();
        }
		// BootstrapDialog.show({
		// 	type: BootstrapDialog.TYPE_DANGER,
		// 	title: '想太多了',
		// 	message: '哪有這麼好康的事情...'
		// });
	})
})