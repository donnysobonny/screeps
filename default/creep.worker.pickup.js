'use strict';

Creep.prototype.updateWorkerPickup = function() {
    switch (this.memory.jobStep) {
        case 0:
            if(this.carry.energy < this.carryCapacity) {
                const resource = this.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
                if(resource) {
                    const res = this.pickup(resource);
                    if(res == ERR_NOT_IN_RANGE) {
                        this.moveToVisualized(resource);
                    } else if(res != OK) {
                        this.stopJob();
                    }
                } else {
                    this.stopJob();
                }
            } else {
                this.memory.jobStep = 1;
            }
            break;
        case 1:
            if(this.carry.energy > 0) {
                this.storeEnergyFromWork();
            } else {
                this.stopJob();
            }
            break;
    }
};
