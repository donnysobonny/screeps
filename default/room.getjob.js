'use strict';

/**
 * This function acts as the beating heart of the workers. Workers will look for something to do when they finish their
 * current task, or can't finish their current task and they do so by calling this function and expecting a response which
 * tells them what to do. The idea is that this function looks at the real-time data of the room and determines what is
 * needed most. Since all creeps in the room will do this when it makes sense to do so, everything should work nicely. The
 * main challenge is figuring out the best logic to determine what is the most needed job. For this reason, the function's
 * internals will change a lot over time but will essentially always spit out the job that is needed most.
 *
 * The first argument of the function is used for creeps to specify how much space there is in their cargo for more energy.
 * The reason for this is certain jobs cannot get to step 2 unless the creep's cargo is full, in which case it's best that
 * we don't give creeps certain jobs that require them to fill their cargo, if there isn't enough energy to do so. For example,
 * if the creep has space to carry 50 more energy, but there isn't enough energy for work (in containers, storage, spawns etc)
 * to collect 50 energy, we won't give them jobs like build/upgrade etc.
 *
 * The currently set up jobs are:
 * - upgrade: upgrade the controller
 *      - steps:
 *          1: get energy for work until full
 *          2: upgrade controller of room until empty
 *      - priority:
 *          - 0.8 if the controller is less than 5000 and there is enough energy for work
 *          - 0.1 if there is enough energy for work
 *          - 0 otherwise
 * - harvest: harvest energy from sources
 *      - steps:
 *          1: claim an unclaimed source space and harvest source until full
 *          2: store energy from work until empty
 *      - priority:
 *          - if there are less creeps doing step 1 of this job than there are harvest spaces, and this creep has space for energy, priority is based on missing energy in room
 *          - 0 otherwise
 * - build: build construction sites, based on build priority
 *      - steps:
 *          1: get energy for work until full
 *          2: build nearest construction site until empty
*       - priority:
 *          - 0.3 if there is energy to work and there are construction sites
 *          - 0 otherwise
 * - towerfuel: refuel towers
 *      - steps:
 *          1: get energy for work until full
 *          2: store energy in closest tower with <= half full energy until empty
 *      - priority:
 *          - 0.7 if there is energy for work and there is a tower <= half full, and there are less than 2 creeps doing this job
 *          - 0 otherwise
 * - pickup: pick up dropped resources
 *      - steps:
 *          1: pick up closest dropped resources until full
 *          2: store energy from work until empty
*       - priority:
 *          - 0.8 if there are resources to pick up and there are less than 1 creeps doing this job
 *          - 0 otherwise
 * - spawnfuel: refuel spawns/extensions
 *      - steps:
 *          1: get energy from containers and storage until full
 *          2: place energy in extensions > spawns until empty
 *      - priority:
 *          - 0.9 if there is enough energy to pick up from containers/storage, and there is spaces in spawns/extensions
 *          - 0 otherwise
 * - transport: move energy from containers to storage to allow harvesting to containers
 *      - steps:
 *          1: get energy from containers and in links until full
 *          2: place energy in storage and out links until empty
 *      - priority
 *          - 0.2 if there is enough energy in containers/in links to collect, and enough space in storage/out links to deliver
 *          - 0 otherwise
 *
 * @param energySpace
 * @returns {string}
 */
Room.prototype.getJob = function (energySpace) {
    let priority = {
        upgrade: 0,
        harvest: 0,
        build: 0,
        towerfuel: 0,
        pickup: 0,
        spawnfuel: 0,
        transport: 0
    };

    const energyForWorkAvail = this.getEnergyInStructuresForWork() >= energySpace;

    //upgrade
    if(energyForWorkAvail && this.controller.ticksToDowngrade < 3000) {
        priority.upgrade = 0.8;
    } else if(energyForWorkAvail) {
        priority.upgrade = 0.1;
    }

    //harvest
    if(energySpace > 0) {
        //work out how many harvest spaces there are
        const sources = this.find(FIND_SOURCES);
        let spaces = 0;
        for(let i = 0; i < sources.length; i++) {
            for(let j = 0; j < this.memory.sourceSpaces.length; j++) {
                if(this.memory.sourceSpaces[j].id == sources[i].id && sources[i].energy > 0) {
                    spaces++;
                }
            }
        }
        //if there there are the same number of harvesters harvesting as their are spaces
        if(this.getWorkerCountByJobAndStep("harvest", 0) >= spaces) {
            priority.harvest = 0;
        } else {
            //harvesting is based on the lack of energy in extensions/spawns/containers
            let avail = 0;
            let cap = 0;

            avail += this.getEnergyInStructure(STRUCTURE_EXTENSION, true);
            avail += this.getEnergyInStructure(STRUCTURE_SPAWN, true);
            avail += this.getEnergyInStructure(STRUCTURE_CONTAINER, true);
            avail += this.getEnergyInStructure(STRUCTURE_LINK, true, false, false, "out");

            cap += this.getEnergyCapacityOfStructure(STRUCTURE_EXTENSION);
            cap += this.getEnergyCapacityOfStructure(STRUCTURE_SPAWN);
            cap += this.getEnergyCapacityOfStructure(STRUCTURE_CONTAINER);
            cap += this.getEnergyCapacityOfStructure(STRUCTURE_LINK, "out");

            priority.harvest = 1 - (avail / cap);
        }
    }

    //build
    if(energyForWorkAvail && this.find(FIND_CONSTRUCTION_SITES).length > 0) {
        priority.build = 0.3;
    }

    //towerfuel
    if(
        energyForWorkAvail &&
        this.getWorkerCountByJob("towerfuel") < 2 &&
        this.getEnergyInStructure(STRUCTURE_TOWER, true) < (this.getEnergyCapacityOfStructure(STRUCTURE_TOWER) * 0.5)
    ) {
        priority.towerfuel = 0.7;
    }

    //pickup
    if(energySpace > 0) {
        if(this.find(FIND_DROPPED_RESOURCES).length > 0 && this.getWorkerCountByJob("pickup") < 1) {
            priority.pickup = 0.8;
        }
    }

    //spawnfuel
    if(energySpace > 0) {
        if(
            (this.getEnergyInStructure(STRUCTURE_CONTAINER, false, true) + this.getEnergyInStructure(STRUCTURE_STORAGE, false, true)) >= energySpace &&
            (
                this.getEnergyInStructure(STRUCTURE_EXTENSION, true) < this.getEnergyCapacityOfStructure(STRUCTURE_EXTENSION) ||
                this.getEnergyInStructure(STRUCTURE_SPAWN, true) < this.getEnergyCapacityOfStructure(STRUCTURE_SPAWN)
            )
        ) {
            priority.spawnfuel = 0.9;
        }
    }

    //transport
    if(energySpace > 0) {
        if(
            (
                this.getEnergyInStructure(STRUCTURE_CONTAINER, false, true) +
                this.getEnergyInStructure(STRUCTURE_LINK, false, true, false, "in")
            ) >= energySpace &&
            (
                (this.getEnergyCapacityOfStructure(STRUCTURE_STORAGE) - this.getEnergyInStructure(STRUCTURE_STORAGE, true)) +
                (this.getEnergyCapacityOfStructure(STRUCTURE_LINK, "out") - this.getEnergyInStructure(STRUCTURE_LINK, true, false, false, "out"))
            ) >= energySpace
        ) {
            priority.transport = 0.2;
        }
    }

    let job = "";
    let highest = 0;
    for(let k in priority) {
        if(priority[k] > highest) {
            highest = priority[k];
            job = k;
        }
    }

    let log = "=== "+this.name+" REQUESTING JOB\n";
    log += "energy space: " + energySpace + "\n";
    for(let k in priority) {
        log += k + ": " + priority[k] + "\n";
    }
    log += "=== RESULT: " + job;
    //console.log(log);

    if(job.length <= 0) {
        if(this.memory.jobRequestFailCount == undefined) {
            this.memory.jobRequestFailCount = 0;
        }
        this.memory.jobRequestFailCount++;
    } else {
        if(this.memory.jobRequestCount == undefined) {
            this.memory.jobRequestCount = 0;
        }
        this.memory.jobRequestCount++;
    }

    return job;
};
