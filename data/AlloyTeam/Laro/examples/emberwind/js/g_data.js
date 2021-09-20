g_data = {
    "game": {
		"stage1": {
			max: 3200,
			unitW: 64,
			unitH: 48,
			cols: 50,
			rows: 3,
			blocks: [
				[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
				[0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
				[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
			]
		}
	},
    "resources": {
        "fonts": [
			{
				"outline_b": 0,
				"font": "Arial",
				"outline": 0.0,
				"base_b": 160,
				"base_g": 163,
				"outline_r": 0,
				"base_r": 165,
				"size": 40,
				"id": "LoadingIntro",
				"outline_g": 0
			}
        ],
		
		"imagesets": [
			
			{
				"name": "laro_logo",
				"atlasparams": "png16",
				"image": "gui/btn_canvas.png.png",
				"frames": [
					"laro_logo"
				],
				"atlas": "atlas/gui/laro_logo",
				"type": "imageset"
			},
			{
				"name": 'game_stone',
				"frames": ['default'],
				"type": "imageset",
				"atlas": "atlas/game_stone"
			},
			// 第一种背景 Titlescreen0,Titlescreen2
            {
				"atlas": "atlas/gui/titlescreen0",
				"frames": [
					"default"
				],
				"image": "titlescreen/titlescreen_00.png",
				"type": "imageset",
				"name": "Titlescreen0"
			},
			{
				"atlas": "atlas/no_c_red/titlescreen1",
				"frames": [
					"default"
				],
				"image": "titlescreen/titlescreen_01.png",
				"type": "imageset",
				"name": "Titlescreen1"
			},
			{
				"atlas": "atlas/gui/titlescreen2",
				"frames": [
					"default"
				],
				"image": "titlescreen/titlescreen_02.png",
				"type": "imageset",
				"name": "Titlescreen2"
			},
			{
				"atlas": "atlas/no_c_red/titlescreen3",
				"frames": [
					"default"
				],
				"image": "titlescreen/titlescreen_03.png",
				"type": "imageset",
				"name": "Titlescreen3"
			},
			// 第二种背景 bg1, bg2
			{
				"name": 'bg1',
				"frames": ['default'],
				"type": "imageset",
				"atlas": "atlas/bg1"
			},
			{
				"name": 'bg2',
				"frames": ['default'],
				"type": "imageset",
				"atlas": "atlas/bg2"
			}
 
		],
        
        "atlases": {
            "atlas/gui/laro_logo": {
				"sources": [
					{
						"data": [
							[
								0,
								0,
								599,
								209,
								0,
								0,
								599,
								209
							]
						],
						"name": "laro_logo"
					}
				],
				"type": "atlas",
				"name": "atlas/gui/laro_logo",
				"filename": "laro.png"
			},
			"atlas/bg1": {
				"sources": [
					{
						"data": [
							[
								0,
								0,
								1697,
								599,
								0,
								0,
								1697,
								599
							]
						],
						"name": "bg1"
					}
				],
				"type": "atlas",
				"name": "atlas/bg1",
				"filename": "0.png"
			},
			"atlas/bg2" : {
				"sources": [
					{
						"data": [
							[
								0,
								0,
								1703,
								399,
								0,
								0,
								1703,
								100
							]
						],
						"name": "bg2"
					}
				],
				"type": "atlas",
				"name": "atlas/bg2",
				"filename": "1.png"
			},
			"atlas/game_stone": {
				"sources": [
					{
						"data": [
							[
								0,
								0,
								63,
								47,
								0,
								0,
								63,
								47
							]
						],
						"name": "game_stone"
					}
				],
				"type": "atlas",
				"name": "atlas/game_stone",
				"filename": "BlockA0.png"
			},
            
            "atlas/game/timetrap": {
				"sources": [
					{
						"data": [
							[
								1624,
								1092,
								1713,
								1188,
								1449,
								1045,
								1960,
								1300
							],
							[
								1371,
								1201,
								1482,
								1310,
								1206,
								1162,
								1717,
								1417
							],
							[
								1584,
								464,
								1720,
								591,
								1428,
								433,
								1939,
								688
							],
							[
								1470,
								0,
								1605,
								135,
								1322,
								-23,
								1833,
								232
							],
							[
								848,
								1608,
								970,
								1720,
								700,
								1584,
								1211,
								1839
							],
							[
								1351,
								1440,
								1452,
								1551,
								1177,
								1417,
								1688,
								1672
							],
							[
								1549,
								1315,
								1645,
								1439,
								1361,
								1305,
								1872,
								1560
							],
							[
								1141,
								1092,
								1262,
								1200,
								953,
								1066,
								1464,
								1321
							],
							[
								991,
								1510,
								1118,
								1614,
								803,
								1480,
								1314,
								1735
							],
							[
								741,
								1575,
								846,
								1705,
								553,
								1544,
								1064,
								1799
							],
							[
								1606,
								0,
								1720,
								146,
								1426,
								-36,
								1937,
								219
							],
							[
								1464,
								232,
								1610,
								355,
								1311,
								194,
								1822,
								449
							],
							[
								0,
								1624,
								153,
								1719,
								-146,
								1585,
								365,
								1840
							],
							[
								983,
								1274,
								1115,
								1380,
								814,
								1246,
								1325,
								1501
							],
							[
								1470,
								894,
								1586,
								1018,
								1282,
								884,
								1793,
								1139
							],
							[
								1263,
								1092,
								1382,
								1199,
								1075,
								1065,
								1586,
								1320
							],
							[
								1574,
								1638,
								1701,
								1717,
								1386,
								1583,
								1897,
								1838
							],
							[
								1483,
								1201,
								1593,
								1308,
								1295,
								1146,
								1806,
								1401
							],
							[
								848,
								1382,
								958,
								1509,
								667,
								1327,
								1178,
								1582
							],
							[
								848,
								1274,
								982,
								1381,
								695,
								1219,
								1206,
								1474
							],
							[
								154,
								1624,
								292,
								1710,
								8,
								1569,
								519,
								1824
							],
							[
								1255,
								1201,
								1370,
								1314,
								1087,
								1172,
								1598,
								1427
							],
							[
								1141,
								1456,
								1235,
								1591,
								953,
								1446,
								1464,
								1701
							],
							[
								1560,
								696,
								1683,
								814,
								1372,
								664,
								1883,
								919
							],
							[
								1584,
								592,
								1711,
								695,
								1396,
								537,
								1907,
								792
							],
							[
								1351,
								1552,
								1451,
								1663,
								1163,
								1497,
								1674,
								1752
							],
							[
								1255,
								1447,
								1349,
								1572,
								1081,
								1392,
								1592,
								1647
							],
							[
								1383,
								1092,
								1501,
								1199,
								1235,
								1034,
								1746,
								1289
							],
							[
								1587,
								894,
								1705,
								1013,
								1439,
								847,
								1950,
								1102
							],
							[
								1141,
								1317,
								1233,
								1455,
								967,
								1294,
								1478,
								1549
							],
							[
								1611,
								232,
								1713,
								381,
								1429,
								222,
								1940,
								477
							],
							[
								488,
								1575,
								617,
								1701,
								308,
								1545,
								819,
								1800
							],
							[
								848,
								1510,
								990,
								1607,
								675,
								1452,
								1186,
								1707
							],
							[
								1502,
								1092,
								1623,
								1195,
								1330,
								1034,
								1841,
								1289
							],
							[
								1351,
								1315,
								1449,
								1439,
								1183,
								1257,
								1694,
								1512
							],
							[
								1594,
								1201,
								1707,
								1304,
								1441,
								1143,
								1952,
								1398
							],
							[
								1453,
								1534,
								1573,
								1620,
								1307,
								1479,
								1818,
								1734
							],
							[
								1141,
								1592,
								1248,
								1706,
								982,
								1564,
								1493,
								1819
							],
							[
								618,
								1575,
								740,
								1698,
								462,
								1565,
								973,
								1820
							],
							[
								1464,
								356,
								1610,
								461,
								1303,
								329,
								1814,
								584
							],
							[
								293,
								1624,
								445,
								1701,
								130,
								1568,
								641,
								1823
							],
							[
								959,
								1382,
								1087,
								1490,
								795,
								1328,
								1306,
								1583
							],
							[
								1255,
								1315,
								1350,
								1446,
								1084,
								1264,
								1595,
								1519
							],
							[
								1141,
								1201,
								1254,
								1316,
								988,
								1154,
								1499,
								1409
							],
							[
								1453,
								1440,
								1573,
								1533,
								1307,
								1400,
								1818,
								1655
							],
							[
								1574,
								1534,
								1672,
								1637,
								1406,
								1505,
								1917,
								1760
							],
							[
								1450,
								1315,
								1548,
								1437,
								1270,
								1305,
								1781,
								1560
							],
							[
								991,
								1615,
								1114,
								1720,
								809,
								1588,
								1320,
								1843
							],
							[
								1470,
								136,
								1597,
								226,
								1290,
								94,
								1801,
								349
							],
							[
								1574,
								1440,
								1691,
								1533,
								1394,
								1399,
								1905,
								1654
							],
							[
								848,
								1092,
								1140,
								1273,
								843,
								1051,
								1354,
								1306
							],
							[
								1176,
								894,
								1469,
								1083,
								1164,
								853,
								1675,
								1108
							],
							[
								848,
								894,
								1175,
								1091,
								836,
								853,
								1347,
								1108
							],
							[
								1208,
								696,
								1559,
								893,
								1196,
								655,
								1707,
								910
							],
							[
								848,
								696,
								1207,
								893,
								836,
								655,
								1347,
								910
							],
							[
								488,
								1375,
								847,
								1574,
								476,
								1336,
								987,
								1591
							],
							[
								488,
								1151,
								845,
								1374,
								474,
								1136,
								985,
								1391
							],
							[
								488,
								927,
								847,
								1150,
								476,
								912,
								987,
								1167
							],
							[
								488,
								696,
								847,
								926,
								476,
								688,
								987,
								943
							],
							[
								1224,
								464,
								1583,
								695,
								1212,
								457,
								1723,
								712
							],
							[
								856,
								464,
								1223,
								695,
								844,
								457,
								1355,
								712
							],
							[
								488,
								464,
								855,
								695,
								476,
								457,
								987,
								712
							],
							[
								0,
								1392,
								429,
								1623,
								-12,
								1385,
								499,
								1640
							],
							[
								0,
								1160,
								431,
								1391,
								-12,
								1153,
								499,
								1408
							],
							[
								0,
								0,
								493,
								231,
								-12,
								-7,
								499,
								248
							],
							[
								0,
								232,
								487,
								463,
								-12,
								225,
								499,
								480
							],
							[
								0,
								696,
								486,
								927,
								-12,
								689,
								499,
								944
							],
							[
								494,
								0,
								981,
								231,
								482,
								-7,
								993,
								248
							],
							[
								0,
								928,
								486,
								1159,
								-12,
								921,
								499,
								1176
							],
							[
								976,
								232,
								1463,
								463,
								964,
								225,
								1475,
								480
							],
							[
								488,
								232,
								975,
								463,
								476,
								225,
								987,
								480
							],
							[
								982,
								0,
								1469,
								231,
								970,
								-7,
								1481,
								248
							],
							[
								0,
								464,
								487,
								695,
								-12,
								457,
								499,
								712
							]
						],
						"name": "TimeTrap"
					}
				],
				"type": "atlas",
				"name": "atlas/game/timetrap",
				"filename": "timetrap.png"
			},
            "atlas/gui/titlescreen0": {
				"sources": [
					{
						"data": [
							[
								0,
								0,
								2131,
								599,
								0,
								0,
								1065,
								599
							]
						],
						"name": "Titlescreen0"
					}
				],
				"type": "atlas",
				"name": "atlas/gui/titlescreen0",
				"filename": "titlescreen0.png"
			},
            "atlas/no_c_red/titlescreen1": {
				"sources": [
					{
						"data": [
							[
								0,
								0,
								799,
								213,
								0,
								0,
								799,
								213
							]
						],
						"name": "Titlescreen1"
					}
				],
				"type": "atlas",
				"name": "atlas/no_c_red/titlescreen1",
				"filename": "titlescreen1.png"
			},
            "atlas/gui/titlescreen2": {
				"sources": [
					{
						"data": [
							[
								0,
								0,
								2131,
								599,
								0,
								0,
								1065,
								599
							]
						],
						"name": "Titlescreen2"
					}
				],
				"type": "atlas",
				"name": "atlas/gui/titlescreen2",
				"filename": "gamebg.png"
			},
            "atlas/no_c_red/titlescreen3": {
				"sources": [
					{
						"data": [
							[
								0,
								0,
								149,
								43,
								0,
								0,
								149,
								43
							]
						],
						"name": "Titlescreen3"
					}
				],
				"type": "atlas",
				"name": "atlas/no_c_red/titlescreen3",
				"filename": "titlescreen3.png"
			},
            "atlas/no_c_red/titlescreen4": {
				"sources": [
					{
						"data": [
							[
								0,
								0,
								1065,
								599,
								0,
								0,
								1065,
								599
							]
						],
						"name": "Titlescreen4"
					}
				],
				"type": "atlas",
				"name": "atlas/no_c_red/titlescreen4",
				"filename": "titlescreen4.png"
			}
            
        },
        // 用于设置 帧动画 数据
        "animations": [
			{
				"nbrOfFrames": 73,
				"name": "TimeTrap",
				"atlas": "atlas/game/timetrap",
				"type": "animation",
				"image": "anims/timetrap.png",
				"pivoty": 128,
				"framerate": 30,
				"pivotx": 256,
				"events": []
			}

            
        ]
        
	}
}