'use strict';

Creep.prototype.updateWorkerHarvest = function () {
    switch (this.memory.jobStep) {
        case 0:
            if(this.carry.energy < this.carryCapacity) {
                if(!this.memory.harvestSource) {
                    this.room.claimBestSource(this);
                }
                if(!this.memory.harvestSource) {
                    this.stopJob();
                } else {
                    this.moveToVisualized(new RoomPosition(this.memory.harvestX, this.memory.harvestY, this.room.name));
                    const res = this.harvest(Game.getObjectById(this.memory.harvestSource));
                    if(res != OK && res != ERR_NOT_IN_RANGE) {
                        this.stopJob();
                    }
                }
            } else {
                this.memory.jobStep = 1;
                this.memory.harvestSource = null;
                this.memory.harvestX = this.memory.harvestY = 0;
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
