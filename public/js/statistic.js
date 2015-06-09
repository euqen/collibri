$(document).ready(function() {
		var fileData = {
			labels: [],
			datasets: [
			{
				label: "Uploaded files",
				fillColor: "rgba(220,220,220,0.2)",
				strokeColor: "rgba(220,220,220,1)",
				pointColor: "rgba(220,220,220,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(220,220,220,1)",
				data: []
			},
			{
				label: "Deleted files",
				fillColor: "rgba(151,187,205,0.2)",
				strokeColor: "rgba(151,187,205,1)",
				pointColor: "rgba(151,187,205,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(151,187,205,1)",
				data: []
			},
			]
		};
		var downloadData = {
			labels: [],
			datasets: [
			{
				label: "Global files downloads",
				fillColor: "rgba(220,220,220,0.2)",
				strokeColor: "rgba(220,220,220,1)",
				pointColor: "rgba(220,220,220,1)",
				pointStrokeColor: "#fff",
				pointHighlightFill: "#fff",
				pointHighlightStroke: "rgba(220,220,220,1)",
				data: []
			}
			]
		};
		var storageData = [
			{
				value: null,
				color:"#F7464A",
				highlight: "#FF5A5E",
				label: "Occupied space"
			},
			{
				value: null,
				color: "#46BFBD",
				highlight: "#5AD3D1",
				label: "Free space"
			}
		];

		var rawStat = !{JSON.stringify(statistic)};
		$.each(rawStat, function(index, stat) {
			fileData.labels.push(stat.month);
			fileData.datasets[1].data.push(stat.uploaded);
			fileData.datasets[0].data.push(stat.deleted);

			downloadData.labels.push(stat.month);
			downloadData.datasets[0].data.push(stat.downloaded);
		});

		var ctx = document.getElementById("fileStat").getContext("2d");
		var firstChart = new Chart(ctx).Line(fileData);
		
		var ctx = document.getElementById("globalDownload").getContext("2d");
		var secondChart = new Chart(ctx).Line(downloadData);

		var rawStorage = !{JSON.stringify(storage)};
		console.log(rawStorage);
		storageData[0].value = 10000 - rawStorage;
		storageData[1].value = rawStorage;

		var ctx1 = document.getElementById("storage").getContext("2d");
		var thirdChart = new Chart(ctx1).Pie(storageData, {animationEasing: "easeOutCubic"});
	});