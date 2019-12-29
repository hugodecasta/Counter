'use strict'

// ------------------------------------------- VAR

var gsi = new GoogleSignIn('1070660703362-5m1lo7rov7tn5ubo8oti29i7aqvu89ju.apps.googleusercontent.com')
var bm = new BoolMaster('BoolMaster/api.php')
var mirror = new Mirror(bm)

// ------------------------------------------- MIRROR

async function get_counter_mirror() {
    let current = await get_current_counter()
    let connect_name = current.id+'counter'
    let obj = await mirror.connect(connect_name)
    return obj
}

// ------------------------------------------- DISP

async function disp_counters() {
}

async function disp_points() {

    let counter_mirror = await get_counter_data()

    

}

// ------------------------------------------- CORE

async function satisfy_user() {
    await disp_points()
}

async function main() {
    await satisfy_user()
}

main()