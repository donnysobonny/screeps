'use strict';

Room.prototype.update = function () {
    if(!this.controller.my) {
        return;
    }

    //spawn workers based on the number of sources available, and the spawn multiplier
    const workerTarget = Math.round(this.memory.sourceSpaceCount * this.memory.spawnMultiplier);
    let count = 0;
    for(let k in Game.creeps) {
        if(Game.creeps[k].room.name == this.name && Game.creeps[k].memory.type == "worker") {
            count++;
        }
    }

    if(count < workerTarget) {
        for(let k in this.spawns) {
            this.spawns[k].memory.waitingToSpawn = true;
        }
        if(this.memory.ticksWaitingToSpawn == undefined) {
            this.memory.ticksWaitingToSpawn = 0;
        }
        this.memory.ticksWaitingToSpawn++;
        this.spawnWorker();
    } else {
        for(let k in this.spawns) {
            this.spawns[k].memory.waitingToSpawn = false;
        }
        if(this.memory.ticksNotWaitingToSpawn == undefined) {
            this.memory.ticksNotWaitingToSpawn = 0;
        }
        this.memory.ticksNotWaitingToSpawn++;
    }
    if(this.memory.ticksNotWaitingToSpawn != undefined && this.memory.ticksNotWaitingToSpawn > 0) {
        this.memory.waitingToSpawnVersusNot = this.memory.ticksWaitingToSpawn / this.memory.ticksNotWaitingToSpawn;
    }

    for(let k in this.spawns) {
        this.spawns[k].update();
    }
    if(this.memory.ticksNotSpawning != undefined && this.memory.ticksNotSpawning > 0) {
        this.memory.spawningVersusNot = this.memory.ticksSpawning / this.memory.ticksNotSpawning;
    }

    for(let k in this.creeps) {
        this.creeps[k].update();
    }

    for(let k in this.towers) {
        this.towers[k].update();
    }

    for(let k in this.links) {
        this.links[k].update();
    }

    if(this.memory.jobRequestCount != undefined && this.memory.jobRequestCount > 0) {
        this.memory.jobsFoundVersusNot = this.memory.jobRequestCount / this.memory.jobRequestFailCount;
    }

    if(this.memory.claimController != undefined && this.memory.claimController.length > 0) {
        const controller = Game.getObjectById(this.memory.claimController);
        if(controller && !controller.my) {
            if(Game.creeps[this.name + "_claim"] == undefined) {
                for(let k in this.spawns) {
                    if(!this.spawns[k].spawning) {
                        this.spawns[k].spawnCreep([CLAIM, MOVE], this.name + "_claim", {
                            memory: {
                                type: "manual"
                            }
                        });
                    }
                }
            } else {
                const creep = Game.creeps[this.name + "_claim"];
                creep.claimController(controller);
                creep.moveTo(controller);
            }
        }
    }

    if(this.memory.buildContructionSite != undefined && this.memory.buildContructionSite.length > 0) {
        const site = Game.getObjectById(this.memory.buildContructionSite);
        if(site) {
            if(Game.creeps[this.name + "_build"] == undefined) {
                this.spawnCreep(this.getBestBody([WORK, CARRY, MOVE]), this.name + "_build", {
                    type: "manual",
                    jobStep: 0
                });
            } else {
                const creep = Game.creeps[this.name + "_build"];
                if(creep.room.name != site.room.name) {
                    creep.moveTo(site);
                    creep.memory.jobStep = 0;
                } else {
                    switch (creep.memory.jobStep) {
                        case 0:
                            if(creep.carry.energy < creep.carryCapacity) {
                                const source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
                                if(source) {
                                    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                                        creep.moveTo(source);
                                    }
                                }
                            } else {
                                creep.memory.jobStep = 1;
                            }
                            break;
                        case 1:
                            if(creep.carry.energy > 0) {
                                if(creep.build(site) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(site);
                                }
                            } else {
                                creep.memory.jobStep = 0;
                            }
                            break;
                    }
                }
            }
        }
    }

    this.autoBuild();
};
/**
 * Get the best worker body based on energy capacity of room
 *
 * @returns {string[]}
 */
Room.prototype.getWorkerBody = function() {
    return this.getBestBody([WORK, CARRY, MOVE]);
};
Room.prototype.getBestBody = function(parts) {
    let initialCost = 0;
    for(let i = 0; i < parts.length; i++) {
        initialCost += Memory.bodyCosts[parts[i]];
    }
    if(this.energyAvailable * this.memory.energyPercentageForSpawning < initialCost) {
        return parts;
    } else {
        let i = 0;
        let cost = 0;
        let body = [];
        while(true) {
            if(cost + Memory.bodyCosts[parts[i]] < this.energyAvailable * this.memory.energyPercentageForSpawning) {
                cost += Memory.bodyCosts[parts[i]];
                body.push(parts[i]);
                i++;
                if(i > parts.length - 1) {
                    i = 0;
                }
            } else {
                break;
            }
        }
        return body;
    }
};
Room.prototype.spawnWorker = function () {
    this.spawnCreep(this.getWorkerBody(), this.randomCreepName(), {
        type: "worker"
    });
};
Room.prototype.spawnCreep = function(body, name, memory) {
    for(let k in this.spawns) {
        if(!this.spawns[k].spawning) {
            this.spawns[k].spawnCreep(body, name, {
                memory: memory
            });
        }
    }
};
Room.prototype.randomCreepName = function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};
