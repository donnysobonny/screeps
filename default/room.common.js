'use strict';

Room.prototype.getEnergyCapacityOfStructure = function(structureType, linkType) {
    let amount = 0;
    switch (structureType) {
        case STRUCTURE_LINK:
            for(let k in this.links) {
                if(this.links[k].memory.type == linkType) {
                    amount += this.links[k].energyCapacity;
                }
            }
            break;
        case STRUCTURE_EXTENSION:
            for(let k in this.extensions) {
                amount += this.extensions[k].energyCapacity;
            }
            break;
        case STRUCTURE_SPAWN:
            for(let k in this.spawns) {
                amount += this.spawns[k].energyCapacity;
            }
            break;
        case STRUCTURE_CONTAINER:
            for(let k in this.containers) {
                amount += this.containers[k].storeCapacity;
            }
            break;
        case STRUCTURE_STORAGE:
            if(this.storage) {
                amount += this.storage.storeCapacity;
            }
            break;
        case STRUCTURE_TOWER:
            for(let k in this.towers) {
                amount += this.towers[k].energyCapacity;
            }
            break;
        default:
            console.error(structureType + " is not a valid structure to check capacity for energy");
            break;
    }
    return amount;
};
Room.prototype.getEnergyInStructure = function (structureType, includeImport, includeExport, discardSpawning, linkType) {
    let amount = 0;
    switch (structureType) {
        case STRUCTURE_LINK:
            for(let k in this.links) {
                if(this.links[k].memory.type != linkType) {
                    continue;
                }

                amount += this.links[k].energy;
                if(includeImport === true) {
                    amount += this.getEnergyImportingTo(k);
                }
                if(includeExport === true) {
                    amount -= this.getEnergyExportingFrom(k);
                }
            }
            break;
        case STRUCTURE_CONTAINER:
            for(let k in this.containers) {
                amount += this.containers[k].store.energy;
                if(includeImport === true) {
                    amount += this.getEnergyImportingTo(k);
                }
                if(includeExport === true) {
                    amount -= this.getEnergyExportingFrom(k);
                }
            }
            break;
        case STRUCTURE_STORAGE:
            if(this.storage) {
                amount += this.storage.store.energy;
                if(includeImport === true) {
                    amount += this.getEnergyImportingTo(this.storage.id);
                }
                if(includeExport === true) {
                    amount -= this.getEnergyExportingFrom(this.storage.id);
                }
            }
            break;
        case STRUCTURE_EXTENSION:
            for(let k in this.extensions) {
                amount += this.extensions[k].energy;
                if(includeImport === true) {
                    amount += this.getEnergyImportingTo(k);
                }
            }
            break;
        case STRUCTURE_SPAWN:
            for(let k in this.spawns) {
                if(discardSpawning === true && this.spawns[k].memory.waitingToSpawn == true) {
                    continue;
                }

                amount += this.spawns[k].energy;
                if(includeImport === true) {
                    amount += this.getEnergyImportingTo(k);
                }
                if(includeExport === true) {
                    amount -= this.getEnergyExportingFrom(k);
                }
            }
            break;
        case STRUCTURE_TOWER:
            for(let k in this.towers) {
                amount += this.towers[k].energy;
                if(includeImport === true) {
                    amount += this.getEnergyImportingTo(k);
                }
            }
            break;
        default:
            console.error(structureType + " is not a valid structure type to store energy...");
            break;
    }
    return amount;
};
Room.prototype.getEnergyInStructuresForWork = function() {
    return this.getEnergyInStructure(STRUCTURE_LINK, false, true, false, "in") + this.getEnergyInStructure(STRUCTURE_STORAGE, false, true) + this.getEnergyInStructure(STRUCTURE_CONTAINER, false, true) + this.getEnergyInStructure(STRUCTURE_SPAWN, false, true, true);
};
Room.prototype.getEnergyImportingTo = function (structureId) {
    let amount = 0;
    if(this.structures[structureId] !== undefined) {
        for(let name in this.creeps) {
            if(this.creeps[name].memory.importingTo == structureId) {
                amount += this.creeps[name].memory.importingAmount;
            }
        }
    }
    return amount;
};
Room.prototype.getEnergyExportingFrom = function (structureId) {
    let amount = 0;
    if(this.structures[structureId] !== undefined) {
        for(let name in this.creeps) {
            if(this.creeps[name].memory.exportingFrom == structureId) {
                amount += this.creeps[name].memory.exportingAmount;
            }
        }
    }
    return amount;
};

Room.prototype.claimBestSource = function(creep) {
    let sources = [];
    for(let i = 0; i < this.memory.sourceSpaces.length; i++) {
        let source = Game.getObjectById(this.memory.sourceSpaces[i].id);
        if(source.energy > 0) {
            let claimed = false;
            for(let name in this.creeps) {
                if(
                    this.creeps[name].memory.harvestSource == this.memory.sourceSpaces[i].id &&
                    this.creeps[name].memory.harvestX == this.memory.sourceSpaces[i].x &&
                    this.creeps[name].memory.harvestY == this.memory.sourceSpaces[i].y
                ) {
                    claimed = true;
                    break;
                }
            }
            if(!claimed) {
                sources.push(this.memory.sourceSpaces[i]);
            }
        }
    }

    let bestId = 0;
    let bestX = 0;
    let bestY = 0;
    let best = 999999999999999;

    for(let i = 0; i < sources.length; i++) {
        if(creep.pos.getRangeTo(sources[i].x, sources[i].y) < best) {
            bestId = sources[i].id;
            bestX = sources[i].x;
            bestY = sources[i].y;
            best = creep.pos.getRangeTo(sources[i].x, sources[i].y);
        }
    }

    if(bestId !== 0) {
        creep.memory.harvestSource = bestId;
        creep.memory.harvestX = bestX;
        creep.memory.harvestY = bestY;
    }
};

/**
 * Get the number of workers doing a specific job
 *
 * @param job
 * @return {number}
 */
Room.prototype.getWorkerCountByJob = function(job) {
    let count = 0;
    for(let name in Game.creeps) {
        if(Game.creeps[name].room.name == this.name && Game.creeps[name].memory.job == job) {
            count++;
        }
    }
    return count;
};
/**
 * Get the number of workers at a specific step in a job
 *
 * @param job
 * @param step
 * @return {number}
 */
Room.prototype.getWorkerCountByJobAndStep = function(job, step) {
    let count = 0;
    for(let name in Game.creeps) {
        if(Game.creeps[name].room.name == this.name && Game.creeps[name].memory.job == job && Game.creeps[name].memory.jobStep == step) {
            count++;
        }
    }
    return count;
};
