'use strict';

StructureTower.prototype.update = function () {
    if(this.energy <= 0) {
        return;
    }

    let best = null;
    let lowest = 99999999;
    let largest = 0;

    //look for enemy creeps with attack power first
    const enemies = this.room.find(FIND_HOSTILE_CREEPS, {
        filter: (obj) => {
            return (obj.getActiveBodyparts(ATTACK) + obj.getActiveBodyparts(RANGED_ATTACK)) > 0
        }
    });
    if(enemies.length > 0) {
        for(let i = 0; i < enemies.length; i++) {
            if(enemies[i].getActiveBodyparts(ATTACK) + enemies[i].getActiveBodyparts(RANGED_ATTACK) > largest) {
                best = enemies[i];
                largest = enemies[i].getActiveBodyparts(ATTACK) + enemies[i].getActiveBodyparts(RANGED_ATTACK);
            }
        }

        if(best) {
            this.attack(best);
        }
    } else {
        //repair anything that is needing repair
        let repairMax = 999999999;
        if(this.room.controller.level < 8) {
            repairMax = this.room.controller.level * 1500;
        }
        const repairTargets = this.room.find(FIND_STRUCTURES, {
            filter: (obj) => {
                return obj.hits < obj.hitsMax && obj.hits < repairMax;
            }
        });

        for(let i = 0; i < repairTargets.length; i++) {
            if(repairTargets[i].hits < lowest) {
                best = repairTargets[i];
                lowest = repairTargets[i].hits;
            }
        }

        if(best) {
            this.repair(best);
        } else {
            //heal any allied creeps
            const healTargets = this.room.find(FIND_MY_CREEPS, {
                filter: (obj) => {
                    return obj.hits < obj.hitsMax
                }
            });
            if(healTargets.length > 0) {
                for(let i = 0; i < healTargets.length; i++) {
                    if(healTargets[i].hits < lowest) {
                        best = healTargets[i];
                        lowest = healTargets[i].hits
                    }
                }

                if(best) {
                    this.heal(best);
                }
            } else {
                //fire at any enemies
                const attackTargets = this.room.find(FIND_HOSTILE_CREEPS);
                if(attackTargets.length > 0) {
                    this.attack(attackTargets[0]);
                }
            }
        }
    }
};
