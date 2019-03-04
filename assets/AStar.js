// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

let Grid = cc.Class({
    ctor(){
        this.x = 0;
        this.y = 0;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.parent = null;
        this.type = 0; // -1障碍物， 0正常， 1目标点， 2起点
    }
    
});

let AStar = cc.Class({
    extends: cc.Component,

    properties:{
        map: cc.Graphics,
    },

    onLoad(){
        this._gridW = 50;   // 单元格子宽度
        this._gridH = 50;   // 单元格子高度
        this.mapH = 13;     // 纵向格子数量
        this.mapW = 24;     // 横向格子数量

        this.is8dir = true; // 是否8方向寻路

        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);

        this.initMap();
    },

    onTouchMove(event){
        let pos = event.getLocation();
        let x = Math.floor(pos.x / (this._gridW + 2));
        let y = Math.floor(pos.y / (this._gridH + 2));
        if (this.gridsList[x][y].type == 0){
            this.gridsList[x][y].type = -1;
            this.draw(x, y, cc.Color.RED);
        }
        cc.log(x + "," + y);
    },

    onTouchEnd(){
        // 开始寻路
        this.findPath(cc.v2(3, 8), cc.v2(19, 5));
    },

    initMap(){
        this.openList = [];
        this.closeList = [];
        this.path = [];
        // 初始化格子二维数组
        this.gridsList = new Array(this.mapW + 1);
        for (let col=0;col<this.gridsList.length; col++){
            this.gridsList[col] = new Array(this.mapH + 1);
        }

        this.map.clear();
        for (let col=0; col<= this.mapW; col++){
            for (let row=0; row<=this.mapH; row++){
                this.draw(col, row);
                this.addGrid(col, row, 0);
            }
        }

        // 设置起点和终点
        let startX = 3;
        let startY = 8;
        let endX = 19;
        let endY = 5;
        this.gridsList[startX][startY].type = 1;
        this.draw(startX, startY, cc.Color.YELLOW);

        this.gridsList[endX][endY].type = 2;
        this.draw(endX, endY, cc.Color.BLUE);
    },

    addGrid(x, y, type){
        let grid = new Grid();
        grid.x = x;
        grid.y = y;
        grid.type = type;
        this.gridsList[x][y] = grid;
    },

    _sortFunc(x, y){
        return x.f - y.f;
    },

    generatePath(grid){
        this.path.push(grid);
        while (grid.parent){
            grid = grid.parent;
            this.path.push(grid);
        }
        cc.log("path.length: " + this.path.length);
        for (let i=0; i<this.path.length; i++){
            // 起点终点不覆盖，方便看效果
            if (i!=0 && i!= this.path.length-1){
                let grid = this.path[i];
                this.draw(grid.x, grid.y, cc.Color.GREEN);
            }
        }
    },

    findPath(startPos, endPos){
        let startGrid = this.gridsList[startPos.x][startPos.y];
        let endGrid = this.gridsList[endPos.x][endPos.y];

        this.openList.push(startGrid);
        let curGrid = this.openList[0];
        while (this.openList.length > 0 && curGrid.type != 2){
            curGrid = this.openList[0];
            if (curGrid.type == 2){
                cc.log("find path success.");
                this.generatePath(curGrid);
                return;
            }

            for(let i=-1; i<=1; i++){
                for(let j=-1; j<=1; j++){
                    if (i !=0 || j != 0){
                        let col = curGrid.x + i;
                        let row = curGrid.y + j;
                        if (col >= 0 && row >= 0 && col <= this.mapW && row <= this.mapH
                            && this.gridsList[col][row].type != -1
                            && this.closeList.indexOf(this.gridsList[col][row]) < 0){
                                if (this.is8dir){
                                    // 8方向 斜向走动时要考虑相邻的是不是障碍物
                                    if (this.gridsList[col-i][row].type == -1 || this.gridsList[col][row-j].type == -1){
                                        continue;
                                    }
                                } else {
                                    // 四方形行走
                                    if (Math.abs(i) == Math.abs(j)){
                                        continue;
                                    }
                                }

                                // 计算g值
                                let g = curGrid.g + parseInt(Math.sqrt(Math.pow(i*10,2) + Math.pow(j*10,2)));
                                if (this.gridsList[col][row].g == 0 || this.gridsList[col][row].g > g){
                                    this.gridsList[col][row].g = g;
                                    // 更新父节点
                                    this.gridsList[col][row].parent = curGrid;
                                }
                                // 计算h值 manhattan估算法
                                this.gridsList[col][row].h = Math.abs(endPos.x - col) + Math.abs(endPos.y - row);
                                // 更新f值
                                this.gridsList[col][row].f = this.gridsList[col][row].g + this.gridsList[col][row].h;
                                // 如果不在开放列表里则添加到开放列表里
                                if (this.openList.indexOf(this.gridsList[col][row]) < 0){
                                    this.openList.push(this.gridsList[col][row]);
                                }
                                // 重新按照f值排序（升序排列)
                                this.openList.sort(this._sortFunc);
                        }
                    }
                }
            }
            // 遍历完四周节点后把当前节点加入关闭列表
            this.closeList.push(curGrid);
            // 从开发列表把当前节点移除
            this.openList.splice(this.openList.indexOf(curGrid), 1);
            if (this.openList.length <= 0){
                cc.log("find path failed.");
            }
        }
    },

    draw(col, row, color){
        color = color != undefined ? color : cc.Color.GRAY;
        this.map.fillColor = color;
        let posX = 2 + col * (this._gridW + 2);
        let posY = 2 + row * (this._gridH + 2);
        this.map.fillRect(posX,posY,this._gridW,this._gridH);
    }
    
});

module.exports = AStar;