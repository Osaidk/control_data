/*jslint nomen: false*/
/*global Trex, $tom, $tx, _FALSE, _NULL, _TRUE */
Trex.TableUtil = {
	/**
	 * isDaumTable
	 * @param {Element} table
	 * @return {boolean}
	 */
	isDaumTable: function (table) {
		return $tx.hasClassName(table, "txc-table");
	},
	/**
	 * cloneNodeForEmptyTd
	 * @param {Element} node
	 */
	cloneNodeForEmptyTd: function (node) {
		var newNode;
		newNode = node.cloneNode(_FALSE);
		Trex.TableUtil.emptyTd(newNode);
		return newNode;
	},
	emptyTd: function (node) {
		node.innerHTML = "&nbsp;";
	},
	/**
	 * splitWidthByColSpan
	 * @param {Element} td
	 */
	splitWidthByColSpan: function (td) {
		var styleWidth;
		if (1 < td.colSpan && td.style.width) {
			styleWidth = parseInt(td.style.width, 10);
			$tom.setStyles(td, {
				width: Math.floor(styleWidth / td.colSpan) + "px"
			}, _TRUE);
		}
	},
	/**
	 * splitHeightByRowSpan
	 * @param {Element} td
	 */
	splitHeightByRowSpan: function (td) {
		var styleHeight;
		if (1 < td.rowSpan && td.style.height) {
			styleHeight = parseInt(td.style.height, 10);
			$tom.setStyles(td, {
				height: Math.floor(styleHeight / td.rowSpan) + "px"
			}, _TRUE);
		}
	},
	/**
	 * collapseCaret
	 * @param {Trex.Canvas.WysiwygPanel} wysiwygPanel
	 * @param {Element} node
	 */
	collapseCaret: function (wysiwygPanel, node) {
		var range;
		try {
			range = wysiwygPanel.getProcessor().createGoogRangeFromNodes(node, 0, node, 0);
			range.select();
		} catch (ignore) {}
		//td space bug from create textnode.
		//wysiwygPanel.getProcessor().moveCaretTo(node);
	},
	/**
	 * getClosestByTagNames
	 * @param {Array} tagNames
	 * @param {Element} el
	 * @return {Element}
	 */
	getClosestByTagNames: function (tagNames, el) {
		var tagName;
		if (el && typeof el.tagName === "string") {
			tagName = el.tagName.toLowerCase();
			if (tagName !== "body") {
				if (tagNames.contains(tagName)) {
					return el;
				} else {
					return arguments.callee(tagNames, el.parentNode);
				}
			}
		}
		return _NULL;
	},
	/**
	 * getTableIndexerFromTd
	 * @param {Element} td
	 * @return {Trex.TableUtil.Indexer}
	 */
	getTableIndexerFromTd: function (td) {
		var currentTable;
		currentTable = Trex.TableUtil.getClosestByTagNames(["table"], td);
		return new Trex.TableUtil.Indexer(currentTable);
	}
};
//////////////////////////////////////////////////////////
/**
 * Trex.TableUtil.Boundary class
 * @param {Object} indexs (optional)
 */
Trex.TableUtil.Boundary = Trex.Class.create({
	initialize: function (indexs) {
		this.top = -1;
		this.left = -1;
		this.bottom = -1;
		this.right = -1;
		if (indexs) {
			this.set(indexs);
		}
	},
	/**
	 * getTop
	 * @return {number} start row index
	 */
	getTop: function () {
		return this.top;
	},
	/**
	 * getLeft
	 * @return {number} start col index
	 */
	getLeft: function () {
		return this.left;
	},
	/**
	 * getBottom
	 * @return {number} end row index
	 */
	getBottom: function () {
		return this.bottom;
	},
	/**
	 * getRight
	 * @return {number} end col index
	 */
	getRight: function () {
		return this.right;
	},
	/**
	 * setTop
	 * @param {number} index
	 */
	setTop: function (index) {
		this.top = index;
	},
	/**
	 * setLeft
	 * @param {number} index
	 */
	setLeft: function (index) {
		this.left = index;
	},
	/**
	 * setBottom
	 * @param {number} index
	 */
	setBottom: function (index) {
		this.bottom = index;
	},
	/**
	 * setRight
	 * @param {number} index
	 */
	setRight: function (index) {
		this.right = index;
	},
	/**
	 * set
	 * @param {Object} indexs
	 */
	set: function (indexs) {
		if ("top" in indexs) {
			this.setTop(indexs.top);
		}
		if ("left" in indexs) {
			this.setLeft(indexs.left);
		}
		if ("bottom" in indexs) {
			this.setBottom(indexs.bottom);
		}
		if ("right" in indexs) {
			this.setRight(indexs.right);
		}
	},
	/**
	 * isValid
	 * @return {boolean}
	 */
	isValid: function () {
		if (this.top === -1) {
			return _FALSE;
		}
		if (this.left === -1) {
			return _FALSE;
		}
		if (this.bottom === -1) {
			return _FALSE;
		}
		if (this.right === -1) {
			return _FALSE;
		}
		return _TRUE;
	},
	/**
	 * addBoundary
	 * @param {number} rowIndex
	 * @param {number} colIndex
	 * @return {boolean} changed
	 */
	addBoundary: function (rowIndex, colIndex) {
		var changedStart, changedEnd;
		changedStart = this.addStartBoundary(rowIndex, colIndex);
		changedEnd = this.addEndBoundary(rowIndex, colIndex);
		return changedStart || changedEnd;
	},
	/**
	 * merge
	 * @param {Trex.TableUtil.Boundary} boundary
	 * @return {boolean} changed
	 */
	merge: function (boundary) {
		var changedStart, changedEnd;
		changedStart = this.addStartBoundary(boundary.top, boundary.left);
		changedEnd = this.addEndBoundary(boundary.bottom, boundary.right);
		return changedStart || changedEnd;
	},
	/**
	 * addStartBoundary
	 * @private
	 * @param {number} rowIndex
	 * @param {number} colIndex
	 * @return {boolean} changed
	 */
	addStartBoundary: function (rowIndex, colIndex) {
		var changed;
		changed = _FALSE;
		if (this.top === -1 || rowIndex < this.top) {
			this.top = rowIndex;
			changed = _TRUE;
		}
		if (this.left === -1 || colIndex < this.left) {
			this.left = colIndex;
			changed = _TRUE;
		}
		return changed;
	},
	/**
	 * addEndBoundary
	 * @private
	 * @param {number} rowIndex
	 * @param {number} colIndex
	 * @return {boolean} changed
	 */
	addEndBoundary: function (rowIndex, colIndex) {
		var changed;
		changed = _FALSE;
		if (this.bottom === -1 || this.bottom < rowIndex) {
			this.bottom = rowIndex;
			changed = _TRUE;
		}
		if (this.right === -1 || this.right < colIndex) {
			this.right = colIndex;
			changed = _TRUE;
		}
		return changed;
	}
});

//////////////////////////////////////////////////////////
// Indexer ??? ???????????? ?????????????????? index ??? table ??? 
// ??????????????? ????????? ??????. DOM ????????? rowSpan ??? 
// colSpan ????????? ????????? index ??? ???????????? ?????? ?????????.
/**
 * Trex.TableUtil.Indexer class
 * @param {Element} table
 */
Trex.TableUtil.Indexer = Trex.Class.create({
	initialize: function (table) {
		this.indexData = _NULL;
		this.table = _NULL;
		
		this.resetIndex();
		this.setTable(table);
		this.makeIndex();
	},
	/**
	 * getRowSize
	 * @return {number}
	 */
	getRowSize: function () {
		return this.indexData.length;
	},
	/**
	 * getColSize
	 * @return {number}
	 */
	getColSize: function () {
		if (0 < this.indexData.length) {
			return this.indexData[0].length;
		}
		return 0;
	},
	/**
	 * getTd
	 * rowIndex ??? colIndex ??? ???????????? td ??? ????????????.
	 * @param {number} rowIndex
	 * @param {number} colIndex
	 * @return {Elememt} td
	 */
	getTd: function (rowIndex, colIndex) {
		if (this.indexData[rowIndex]) {
			if (this.indexData[rowIndex][colIndex]) {
				return this.indexData[rowIndex][colIndex];
			}
		}
		return _NULL;
	},
	/**
	 * getTdArr
	 * Boundary ??? ???????????? td ?????? ????????????.
	 * @param {Trex.TableUtil.Boundary} boundary
	 * @return {Array} tdArr [td, td, ...] (order by top-left)
	 */
	getTdArr: function (boundary) {
		var result, rowIndex, cells, colIndex;
		result = [];
		rowIndex = boundary.top;
		while (rowIndex <= boundary.bottom) {
			cells = this.indexData[rowIndex];
			colIndex = boundary.left;
			while (colIndex <= boundary.right) {
				if (result.contains(cells[colIndex]) === _FALSE) {
					result.push(cells[colIndex]);
				}
				colIndex += 1;
			}
			rowIndex += 1;
		}
		return result;
	},
	
	/**
	 * getTdArrHasTop
	 * ???????????? row index ??? top ?????? ????????? cell ?????? ????????????. 
	 * @param {number} index
	 * @return {Array} tdArr [td, td, ...] (order by left-top)
	 */
	getTdArrHasTop: function (index) {
		var result, currentCell, adjoiningCell, len, i;
		result = [];
		len = this.getColSize();
		for (i = 0; i < len; i += 1) {
			currentCell = this.getTd(index, i);
			adjoiningCell = this.getTd(index - 1, i);
			this.uniquePushWhenDifferent(result, currentCell, adjoiningCell);
		}
		return result;
	},
	/**
	 * getTdArrHasBottom
	 * ???????????? row index ??? bottom ?????? ????????? cell ?????? ????????????. 
	 * @param {number} index
	 * @return {Array} tdArr [td, td, ...] (order by left-top)
	 */
	getTdArrHasBottom: function (index) {
		var result, currentCell, adjoiningCell, len, i;
		result = [];
		len = this.getColSize();
		for (i = 0; i < len; i += 1) {
			currentCell = this.getTd(index, i);
			adjoiningCell = this.getTd(index + 1, i);
			this.uniquePushWhenDifferent(result, currentCell, adjoiningCell);
		}
		return result;
	},
	/**
	 * getTdArrHasLeft
	 * ???????????? row index ??? left ??? ????????? cell ?????? ????????????.
	 * @param {number} index
	 * @return {Array} tdArr [td, td, ...] (order by left-top)
	 */
	getTdArrHasLeft: function (index) {
		var result, currentCell, adjoiningCell, len, i;
		result = [];
		len = this.getRowSize();
		for (i = 0; i < len; i += 1) {
			currentCell = this.getTd(i, index);
			adjoiningCell = this.getTd(i, index - 1);
			this.uniquePushWhenDifferent(result, currentCell, adjoiningCell);
		}
		return result;
	},
	/**
	 * getTdArrHasRight
	 * ???????????? row index ??? right ??? ????????? cell ?????? ????????????.
	 * @param {number} index
	 * @return {Array} tdArr [td, td, ...] (order by left-top)
	 */
	getTdArrHasRight: function (index) {
		var result, currentCell, adjoiningCell, len, i;
		result = [];
		len = this.getRowSize();
		for (i = 0; i < len; i += 1) {
			currentCell = this.getTd(i, index);
			adjoiningCell = this.getTd(i, index + 1);
			this.uniquePushWhenDifferent(result, currentCell, adjoiningCell);
		}
		return result;
	},
	
	/**
	 * getBoundary
	 * td ??? ???????????? boundary ??? ?????????.
	 * @param {Elememt} td
	 * @return {Trex.TableUtil.Boundary} boundary
	 */
	getBoundary: function (td) {
		var result, rows, rowLen, rowIndex, cells, cellLen, colIndex;
		result = new Trex.TableUtil.Boundary();
		rows = this.indexData;
		rowLen = rows.length;
		for (rowIndex = 0; rowIndex < rowLen; rowIndex += 1) {
			cells = rows[rowIndex];
			if (cells) {
				cellLen = cells.length;
				for (colIndex = 0; colIndex < cellLen; colIndex += 1) {
					if (cells[colIndex] === td) {
						result.addBoundary(rowIndex, colIndex);
					}
				}
			}
		}
		return result;
	},
	/**
	 * reload
	 * ????????? ??????(???????????? ??????????????? ???).
	 */
	reload: function () {
		this.resetIndex();
		this.makeIndex();
	},
	/**
	 * uniquePushWhenDifferent
	 * currentCell ??? adjoiningCell ??? ????????? currentCell ??? tdArr ??? ???????????? push ??????.
	 * @private
	 * @param {Array} tdArr
	 * @param {Element} currentCell
	 * @param {Element} adjoiningCell
	 */
	uniquePushWhenDifferent: function (tdArr, currentCell, adjoiningCell) {
		if (currentCell !== adjoiningCell) {
			if (tdArr.contains(currentCell) === _FALSE) {
				tdArr.push(currentCell);
			}
		}
	},
	/**
	 * resetIndex
	 * @private
	 */
	resetIndex: function () {
		this.indexData = [];
	},
	/**
	 * setTable
	 * @private
	 * @param {Element} table
	 */
	setTable: function (table) {
		this.table = table;
	},
	/**
	 * makeIndex
	 * rowSpan ??? colSpan ??? ?????? ????????? array ??? table cell ?????? ???????????????.
	 * @private
	 */
	makeIndex: function () {
		var rows, rowLen, rowIndex, row, cells, cellLen, colIndex, cell;
		rows = this.table.rows;
		rowLen = rows.length;
		for (rowIndex = 0; rowIndex < rowLen; rowIndex += 1) {
			row = rows[rowIndex];
			cells = row.cells;
			cellLen = cells.length;
			for (colIndex = 0; colIndex < cellLen; colIndex += 1) {
				cell = cells[colIndex];
				this.addCellIndex(rowIndex, cell);
			}
		}
	},
	/**
	 * addCellIndex
	 * ????????? ?????? indexData ??? ?????? cell ??? ?????? index ??? ????????????.
	 * @private
	 * @param {number} rowIndex
	 * @param {Element} cell
	 */
	addCellIndex: function (rowIndex, cell) {
		var viewIndexOfCell, row, rowSpan, calculatedRowIndex, col, colSpan;
		viewIndexOfCell = this.getNextCellIndex(this.indexData[rowIndex]);
		rowSpan = cell.rowSpan;
		for (row = 0; row < rowSpan; row += 1) {
			calculatedRowIndex = rowIndex + row;
			if (! this.indexData[calculatedRowIndex]) {
				this.indexData[calculatedRowIndex] = [];
			}
			colSpan = cell.colSpan;
			for (col = 0; col < colSpan; col += 1) {
				this.indexData[calculatedRowIndex][viewIndexOfCell + col] = cell;
			}
		}
	},
	/**
	 * getNextCellIndex
	 * arr ??? ??????????????? ???????????? ?????? ??? ????????? index ??? ????????????.
	 * arr ??? ????????? 0 ??? ??????, ??? ????????? ????????? length ??? ????????????.
	 * @private
	 * @param {Array} arr
	 * @return {number} cell index
	 */
	getNextCellIndex: function (arr) {
		var i, len;
		if (! arr) {
			return 0;
		}
		len = arr.length;
		for (i = 0; i < len; i += 1) {
			if (! arr[i]) {
				break;
			}
		}
		return i;
	}
});
