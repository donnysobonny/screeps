'use strict';

Creep.prototype.updateWorkerBuilder = function () {
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
                if(!this.memory.buildTarget) {
                    let target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                        filter: (obj) => {
                            return obj.structureType == STRUCTURE_SPAWN
                        }
                    });
                    if(!target) {
                        target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                            filter: (obj) => {
                                return obj.structureType == STRUCTURE_EXTENSION
                            }
                        });
                    }
                    if(!target) {
                        target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                            filter: (obj) => {
                                return obj.structureType == STRUCTURE_TOWER
                            }
                        });
                    }
                    if(!target) {
                        target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                            filter: (obj) => {
                                return obj.structureType == STRUCTURE_WALL
                            }
                        });
                    }
                    if(!target) {
                        target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                            filter: (obj) => {
                                return obj.structureType == STRUCTURE_CONTAINER
                            }
                        });
                    }
                    if(!target) {
                        target = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                    }
                    if(target) {
                        this.memory.buildTarget = target.id;
                    } else {
                        this.stopJob();
                    }
                } else {
                    const obj = Game.getObjectById(this.memory.buildTarget);
                    if(obj) {
                        const res = this.build(obj);
                        if(res == ERR_NOT_IN_RANGE) {
                            this.moveToVisualized(obj);
                        } else if(res != OK) {
                            if(this.carry.energy > 0) {
                                this.memory.buildTarget = null;
                            } else {
                                this.stopJob();
                            }
                        }
                    } else {
                        if(this.carry.energy > 0) {
                            this.memory.buildTarget = null;
                        } else {
                            this.stopJob();
                        }
                    }
                }
            } else {
                this.stopJob();
            }
            break;
    }
};
