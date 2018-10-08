'use strict';

require("room.setup");
require("room.common");
require("room.update");
require("room.getjob");
require("room.autobuild");
require("structure.setup")
require("link.update");
require("spawn.update");
require("creep.setup");
require("creep.common");
require("creep.update");
require("creep.worker");
require("creep.worker.harvest");
require("creep.worker.upgrade");
require("creep.worker.builder");
require("creep.worker.transport");
require("creep.worker.towerfuel");
require("creep.worker.spawnfuel");
require("creep.worker.pickup");
require("tower.update");

module.exports.loop = function () {
    Memory.bodyCosts = {};
    Memory.bodyCosts[MOVE] = 50;
    Memory.bodyCosts[WORK] = 100;
    Memory.bodyCosts[CARRY] = 50;
    Memory.bodyCosts[ATTACK] = 80;
    Memory.bodyCosts[RANGED_ATTACK] = 150;
    Memory.bodyCosts[HEAL] = 250;
    Memory.bodyCosts[CLAIM] = 600;
    Memory.bodyCosts[TOUGH] = 10;

    const site = Game.getObjectById("5bb12f056cbcf3277ee10798");
    if(site != null) {
        if(Game.creeps["sbuilder"] == undefined) {
            Game.spawns.Spawn1.spawnCreep([WORK, CARRY, MOVE, CARRY], "sbuilder", {
                memory: {
                    type: "manual",
                    jobStep: 0
                }
            });
        } else {
            Game.creeps.sbuilder.say("SUP");
            switch (Game.creeps.sbuilder.memory.jobStep) {
                default:
                    if(Game.creeps.sbuilder.room.name != "E6N42") {
                        Game.creeps.sbuilder.moveTo(new RoomPosition(25, 25, "E6N42"));
                    } else {
                        if(Game.creeps.sbuilder.carry.energy < Game.creeps.sbuilder.carryCapacity) {
                            Game.creeps.sbuilder.getEnergyForWork();
                        } else {
                            Game.creeps.sbuilder.stopExporting();
                            Game.creeps.sbuilder.memory.jobStep = 1;
                        }
                    }
                    break;
                case 1:
                    if(Game.creeps.sbuilder.carry.energy > 0) {
                        if(Game.creeps.sbuilder.build(site) == ERR_NOT_IN_RANGE) {
                            Game.creeps.sbuilder.moveTo(site);
                        }
                    } else {
                        Game.creeps.sbuilder.memory.jobStep = 0;
                    }
                    break;
            }
        }
    }

    for(let k in Game.rooms) {
        Game.rooms[k].start();
    }
    for(let k in Game.rooms) {
        Game.rooms[k].update();
    }
    for(let k in Game.rooms) {
        Game.rooms[k].end();
    }

    for(let k in Memory.creeps) {
        if(Game.creeps[k] == undefined) {
            delete (Memory.creeps[k]);
        }
    }

    for(let k in Memory.structures) {
        if(!Game.getObjectById(k)) {
            delete (Memory.structures[k]);
        }
    }
};
