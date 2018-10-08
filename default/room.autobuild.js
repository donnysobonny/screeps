'use strict';

let map = require("room.autobuild.map");

Room.prototype.autoBuild = function () {
    if(this.memory.autoBuild !== true) {
        return;
    }

    if(this.memory.nextAutoBuild == undefined) {
        this.memory.nextAutoBuild = 0;
    }

    if(Game.time > this.memory.nextAutoBuild) {
        this.memory.nextAutoBuild = Game.time + 100;

        if(this.memory.autoBuildOrigin == undefined) {
            //we take the origin 3 down from the spawn
            const spawn = this.getPositionAt(25,25).findClosestByRange(FIND_MY_SPAWNS);
            if(spawn) {
                this.memory.autoBuildOrigin = {
                    x: spawn.pos.x,
                    y: spawn.pos.y + 3
                };
            }
        }

        if(this.memory.autoBuildOrigin != undefined) {
            const buildX = this.memory.autoBuildOrigin.x;
            const buildY = this.memory.autoBuildOrigin.y;

            //roads
            for(let i = 0; i < map[STRUCTURE_ROAD].length; i++) {
                const x = map[STRUCTURE_ROAD][i].x;
                const y = map[STRUCTURE_ROAD][i].y;
                const res = this.createConstructionSite(
                    buildX + x,
                    buildY + y,
                    STRUCTURE_ROAD
                );
                if(res != OK && res != ERR_INVALID_TARGET) {
                    break;
                }
            }

            //extensions
            map[STRUCTURE_EXTENSION].sort(function(a, b){return a.d - b.d});
            for(let i = 0; i < map[STRUCTURE_EXTENSION].length; i++) {
                const x = map[STRUCTURE_EXTENSION][i].x;
                const y = map[STRUCTURE_EXTENSION][i].y;
                const res = this.createConstructionSite(
                    buildX + x,
                    buildY + y,
                    STRUCTURE_EXTENSION
                );
                if(res != OK && res != ERR_INVALID_TARGET) {
                    break;
                }
            }

            //tower
            for(let i = 0; i < map[STRUCTURE_TOWER].length; i++) {
                const x = map[STRUCTURE_TOWER][i].x;
                const y = map[STRUCTURE_TOWER][i].y;
                const res = this.createConstructionSite(
                    buildX + x,
                    buildY + y,
                    STRUCTURE_TOWER
                );
                if(res != OK && res != ERR_INVALID_TARGET) {
                    break;
                }
            }

            //storage
            const res = this.createConstructionSite(
                buildX,
                buildY,
                STRUCTURE_STORAGE
            );

            //link
            for(let i = 0; i < map[STRUCTURE_LINK].length; i++) {
                const x = map[STRUCTURE_LINK][i].x;
                const y = map[STRUCTURE_LINK][i].y;
                const res = this.createConstructionSite(
                    buildX + x,
                    buildY + y,
                    STRUCTURE_LINK
                );
                if(res != OK && res != ERR_INVALID_TARGET) {
                    break;
                }
            }

            //if there is energy in towers, build walls/ramparts
            if(this.getEnergyInStructure(STRUCTURE_TOWER) > 50) {
                for(let i = 0; i < map[STRUCTURE_WALL].length; i++) {
                    const x = map[STRUCTURE_WALL][i].x;
                    const y = map[STRUCTURE_WALL][i].y;
                    const res = this.createConstructionSite(
                        buildX + x,
                        buildY + y,
                        STRUCTURE_WALL
                    );
                    if(res != OK && res != ERR_INVALID_TARGET) {
                        break;
                    }
                }

                //for ramparts, we build the outer walls based on the controller level being 3+
                map[STRUCTURE_RAMPART].sort(function(a, b){return b.d - a.d});
                let min = map[STRUCTURE_RAMPART][0].d;
                if(this.controller.level > 8) {
                    min = -1;
                } else {
                    min -= this.controller.level - 3;
                }
                for(let i = 0; i < map[STRUCTURE_RAMPART].length; i++) {
                    if(map[STRUCTURE_RAMPART][i].d < min) {
                        continue;
                    }
                    const x = map[STRUCTURE_RAMPART][i].x;
                    const y = map[STRUCTURE_RAMPART][i].y;
                    const res = this.createConstructionSite(
                        buildX + x,
                        buildY + y,
                        STRUCTURE_RAMPART
                    );
                    if(res != OK && res != ERR_INVALID_TARGET) {
                        break;
                    }
                }
            }
        }
    }


};