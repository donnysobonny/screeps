'use strict';

Creep.prototype.updateWorkerSpawnfuel = function() {

    switch (this.memory.jobStep) {
        case 0:
            if(this.carry.energy < this.carryCapacity) {
                if(!this.memory.exportingFrom) {
                    const target = this.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (obj) => {
                            return (
                                (obj.structureType == STRUCTURE_CONTAINER || obj.structureType == STRUCTURE_STORAGE) &&
                                obj.store.energy - this.room.getEnergyExportingFrom(obj.id) > 0
                            );
                        }
                    });

                    if(target) {
                        this.memory.exportingFrom = target.id;
                        this.memory.exportingAmount = this.carryCapacity - this.carry.energy;
                    } else {
                        this.stopJob();
                    }
                } else {

                    const obj = Game.getObjectById(this.memory.exportingFrom);
                    if(obj) {
                        const res = this.withdraw(obj, RESOURCE_ENERGY);
                        if(res == ERR_NOT_IN_RANGE) {
                            this.moveToVisualized(obj);
                        } else if(res != OK) {
                            this.stopExporting();
                        }
                    } else {
                        this.stopExporting();
                    }
                }
            } else {
                this.stopExporting();
                this.memory.jobStep = 1;
            }
            break;
        case 1:
            if(this.carry.energy > 0) {
                this.storeEnergyFromWork(true, true);
            } else {
                this.stopJob();
            }
            break;
    }
};
