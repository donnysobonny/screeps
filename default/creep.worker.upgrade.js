'use strict';

Creep.prototype.updateWorkerUpgrade = function () {
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
                const res = this.upgradeController(this.room.controller);
                if(res == ERR_NOT_IN_RANGE) {
                    this.moveToVisualized(this.room.controller);
                } else if(res != OK) {
                    this.stopJob();
                }
            } else {
                this.stopJob();
            }
            break;
    }
};
