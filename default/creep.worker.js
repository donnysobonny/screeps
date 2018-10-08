'use strict';

Creep.prototype.updateWorker = function () {
    if(!this.memory.job) {
        this.memory.job = this.room.getJob(this.carryCapacity - this.carry.energy);
        this.memory.jobStep = 0;
    }

    this.say(this.memory.job + "" + this.memory.jobStep);

    if(this.ticksToLive < 50) {
        this.say("Goodbye :(");
        const spawn = this.pos.findClosestByRange(FIND_MY_SPAWNS);
        if(spawn) {
            if(spawn.recycleCreep(this) == ERR_NOT_IN_RANGE) {
                this.moveTo(spawn);
            }
        }
    } else {
        switch (this.memory.job) {
            case "harvest":
                this.updateWorkerHarvest();
                break;
            case "upgrade":
                this.updateWorkerUpgrade();
                break;
            case "build":
                this.updateWorkerBuilder();
                break;
            case "transport":
                this.updateWorkerTransport();
                break;
            case "towerfuel":
                this.updateWorkerTowerfuel();
                break;
            case "pickup":
                this.updateWorkerPickup();
                break;
            case "spawnfuel":
                this.updateWorkerSpawnfuel();
                break;
            default:
                this.stopJob();
                break;
        }
    }
};

Creep.prototype.storeEnergyFromWork = function(avoidContainers, avoidStorage) {
    if(!this.memory.importingTo) {
        let target = null;
        if(!target && avoidContainers !== true && avoidStorage !== true) {
            target = this.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (obj) => {

                    return (
                        (
                            (obj.structureType == STRUCTURE_CONTAINER || obj.structureType == STRUCTURE_STORAGE) &&
                            (obj.storeCapacity - (obj.store.energy + this.room.getEnergyImportingTo(obj.id))) > 0
                        ) ||
                        (
                            obj.structureType == STRUCTURE_LINK &&
                            obj.memory.type == "out" &&
                            (obj.energyCapacity - obj.energy ) > 0
                        )
                    );
                }
            });
        }
        if(!target && avoidContainers !== true && avoidStorage === true) {
            target = this.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (obj) => {

                    return (
                        (
                            (obj.structureType == STRUCTURE_CONTAINER) &&
                            (obj.storeCapacity - (obj.store.energy + this.room.getEnergyImportingTo(obj.id))) > 0
                        ) ||
                        (
                            obj.memory.type == "out" &&
                            (obj.energyCapacity - obj.energy ) > 0
                        )
                    );
                }
            });
        }
        if(!target && avoidContainers === true && avoidStorage !== true) {
            target = this.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (obj) => {

                    return (
                        (obj.structureType == STRUCTURE_STORAGE) &&
                        (obj.storeCapacity - (obj.store.energy + this.room.getEnergyImportingTo(obj.id))) > 0
                    );
                }
            });
        }
        if(!target) {
            target = this.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (obj) => {
                    return obj.structureType == STRUCTURE_EXTENSION && (obj.energyCapacity - (obj.energy + this.room.getEnergyImportingTo(obj.id))) > 0
                }
            });
        }
        if(!target) {
            target = this.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (obj) => {
                    return obj.structureType == STRUCTURE_SPAWN && (obj.energyCapacity - (obj.energy + this.room.getEnergyImportingTo(obj.id))) > 0
                }
            });
        }
        if(target) {
            this.memory.importingTo = target.id;
            this.memory.importingAmount = this.carry.energy;
        } else {
            this.stopJob();
        }
    } else {
        const obj = Game.getObjectById(this.memory.importingTo);
        if(obj) {
            const result = this.transfer(obj, RESOURCE_ENERGY);
            if(result == ERR_NOT_IN_RANGE) {
                this.moveToVisualized(obj);
            } else if(result != OK) {
                //can't store in target for some reason, stop storing to find another one...
                this.stopImporting();
            }
        } else {
            this.stopImporting();
        }
    }
};

Creep.prototype.getEnergyForWork = function() {
    if(!this.memory.exportingFrom) {
        let target = this.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (obj) => {
                return (
                    (
                        (obj.structureType == STRUCTURE_STORAGE || obj.structureType == STRUCTURE_CONTAINER) &&
                        obj.store.energy - this.room.getEnergyExportingFrom(obj.id) >= this.carryCapacity - this.carry.energy
                    ) ||
                    (
                        obj.structureType == STRUCTURE_LINK &&
                        obj.memory.type == "in" &&
                        obj.energy - this.room.getEnergyExportingFrom(obj.id) >= this.carryCapacity - this.carry.energy
                    )
                );
            }
        });
        if(!target) {
            target = this.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (obj) => {
                    return (
                        obj.structureType == STRUCTURE_SPAWN &&
                        !obj.spawning &&
                        obj.energy - this.room.getEnergyExportingFrom(obj.id) >= this.carryCapacity - this.carry.energy
                    );
                }
            });
        }
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
};

Creep.prototype.createRoad = function() {
    this.room.createConstructionSite(this.pos, STRUCTURE_ROAD);
};

Creep.prototype.moveToWorkerFlag = function () {
    if(Game.flags["Workers"] !== undefined) {
        this.moveToVisualized(Game.flags.Workers);
    } else {
        this.moveToCenter();
    }
};

Creep.prototype.setImportingTo = function(structureId, amount) {
    this.memory.importingTo = structureId;
    this.memory.importingAmount = amount;
};
Creep.prototype.setExportingFrom = function(structureId, amount) {
    this.memory.exportingFrom = structureId;
    this.memory.exportingAmount = amount;
};
Creep.prototype.stopImporting = function() {
    this.setImportingTo(null, 0);
};
Creep.prototype.stopExporting = function() {
    this.setExportingFrom(null, 0);
};

Creep.prototype.stopJob = function () {
    this.memory.job = null;
    this.memory.jobStep = 0;
    this.memory.harvestSource = null;
    this.memory.harvestX = this.harvestY = 0;
    this.memory.buildTarget = null;
    this.stopImporting();
    this.stopExporting();
    this.moveToWorkerFlag();
};
