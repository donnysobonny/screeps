'use strict';

Creep.prototype.updateWorkerTowerfuel = function () {
    switch (this.memory.jobStep) {
        case 0:
            if(this.carry.energy < this.carryCapacity) {
                this.getEnergyForWork();
            } else {
                this.stopExporting();
                this.memory.jobStep = 1;
            }
            break;
        case 1:
            if(this.carry.energy > 0) {
                if(!this.memory.importingTo) {
                    const towers = this.room.find(FIND_STRUCTURES, {
                        filter: (obj) => {
                            return obj.structureType == STRUCTURE_TOWER
                        }
                    });

                    let best = null;
                    let lowest = 999999999999;
                    for(let i = 0; i < towers.length; i++) {
                        if(towers[i].energy < lowest) {
                            best = towers[i];
                            lowest = towers[i].energy;
                        }
                    }

                    if(best) {
                        this.memory.importingTo = best.id;
                        this.memory.importingAmount = this.carry.energy;
                    } else {
                        this.stopJob();
                    }
                } else {
                     const tower = Game.getObjectById(this.memory.importingTo);
                     if(tower) {
                         const res = this.transfer(tower, RESOURCE_ENERGY);
                         if(res == ERR_NOT_IN_RANGE) {
                             this.moveToVisualized(tower);
                         } else if(res != OK) {
                             this.stopImporting();
                         }
                     } else {
                         this.stopImporting();
                     }
                }
            } else {
                this.stopJob();
            }
            break;
    }
};
