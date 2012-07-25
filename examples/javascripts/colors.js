function initColors(colorInfo){
	switch( Math.floor(Math.random()*8) ) {
		case 0:
			colorInfo.colors_name = "Primarily Mellow";
			colorInfo.colors = ['#B01E1E','#174385','#15592F','#FCDC0A','#000000'];
			colorInfo.border_width = 3.0;
			break;
		case 1:
			colorInfo.colors_name = "A Sad Memory";
			colorInfo.colors = ['#1C465C','#597B6B','#D5C263','#E8DF97','#2D88A5'];
			colorInfo.border_width = 5.0;
			break;
		case 2:
			colorInfo.colors_name = "Patriot Games";
			colorInfo.colors = ['#ffffff','#353842','#5E6669','#BED1AE','#5E6669','#DEEFBB','#5E6669','#BED1AE','#5E6669','#DEEFBB','#C7493B'];
			colorInfo.border_width = 3.0;
			break;
		case 3:
			colorInfo.colors_name = "Weakerthans";
			colorInfo.colors = ['#ffffff', '#292929','#292929','#E2E2E2','#E2E2E2','#E2E2E2','#1A4685','#E80101','#FFBF15'];
			colorInfo.border_width = 1.0;
			break;
		case 4:
			colorInfo.colors_name = "Stoicism";
			colorInfo.colors = ['#303030','#303030','#303030','#303030','#303030','#303030','#303030','#303030','#F5EDDF','#F5EDDF','#F5EDDF','#F5EDDF','#F5EDDF','#EDE592','#EDE592','#BFC7C7','#BFC7C7','#D84818'];
			colorInfo.border_width = 1.0;
			break;
		case 5:
			colorInfo.colors_name = "Fish bowl";
			colorInfo.colors = ['#BDCCDF', '#BDD1DE', '#BDDEDE', '#BDDED7', '#FC8B4A'];
			colorInfo.border_width = 1.0;
			break;
		case 6:
			colorInfo.colors_name = "Bull in a China Shop";
			colorInfo.colors = ['#FDECB1','#F7E5B5','#3A271F','#C51616','#EDDBB4'];
			colorInfo.border_width = 3.0;
			break;
		case 7:
			colorInfo.colors_name = "A Funk Odyssey";
			colorInfo.colors = ['#7A6C5D','#7A6C5D','#7A6C5D','#7A6C5D','#7A6C5D','#7A6C5D','#F0B603','#F0B603','#F0B603','#F0B603','#F0B603','#98AAAC','#98AAAC','#98AAAC','#A3033D','#A3033D','#E9FABE'];
			colorInfo.border_width = 3.0;
			break;
	}
}
