'use strict';

StructureSpawn.prototype.update = function () {
    if(this.spawning) {
        if(this.room.memory.ticksSpawning == undefined) {
            this.room.memory.ticksSpawning = 0;
        }
        this.room.memory.ticksSpawning++;
    } else {
        if(this.room.memory.ticksNotSpawning == undefined) {
            this.room.memory.ticksNotSpawning = 0;
        }
        this.room.memory.ticksNotSpawning++;
    }
};
