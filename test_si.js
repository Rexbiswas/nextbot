import si from 'systeminformation';

console.log('Testing systeminformation...');

async function test() {
    try {
        console.log('Fetching cpu...');
        const cpu = await si.currentLoad();
        console.log('CPU:', cpu.currentLoad);

        console.log('Fetching mem...');
        const mem = await si.mem();
        console.log('Mem:', mem.active);

        // console.log('Fetching network...');
        // const net = await si.networkStats();
        // console.log('Net:', net ? net.length : 0);

        console.log('Done.');
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
