'use strict'

// ------------------------------------------------ VAR

var bm = new BoolMaster('BoolMaster/api.php')
var gsi = new GoogleSignIn('1070660703362-5m1lo7rov7tn5ubo8oti29i7aqvu89ju.apps.googleusercontent.com')

// ------------------------------------------------ PREFIX

async function set_user_prefix() {

    let profile = await gsi.get_profile_data()
    let prefix = 'counters'+profile.id

    bm.reset_prefix()
    bm.set_prefix(prefix)
}

async function set_counter_prefix(counter) {

    let profile = await gsi.get_profile_data()
    let prefix = 'counter'+profile.id+counter.id

    bm.reset_prefix()
    bm.set_prefix(prefix)
}

// ------------------------------------------------ COUNTERS

async function bmread(key, def={}) {
    if(! await bm.key_exists(key)) {
        return def
    }
    return await bm.read_key(key)
}

async function get_counters() {
    await set_user_prefix()
    return await bmread('counters')
}

async function set_counters(counters) {
    await set_user_prefix()
    bm.write_key('counters',counters)
}

async function add_counter(counter) {
    let counters = await get_counters()
    counters[counter.id] = counter
    console.log(counters)
    await set_counters(counters)
}

async function remove_counter(counter) {
    let counters = await get_counters()
    delete counters[counter.id]
    await set_counters(counters)
}

// ------------------------------------------------ COUNTER

async function get_current_counter() {
    await set_user_prefix()
    let cur = await bmread('current_counter',null)
    if(cur == null) {
        await set_current_counter(await ask_user_counter())
        return await get_current_counter()
    }
    return cur
}

async function set_current_counter(counter) {
    await set_user_prefix()
    await bm.write_key('current_counter',counter)
}

async function unset_current_counter() {
    await set_current_counter(null)
}

// -----------------

async function bmreadcounter(key,def={}) {
    await set_counter_prefix(await get_current_counter())
    return await bmread(key,def)
}

async function bmwritecounter(key,data) {
    await set_counter_prefix(await get_current_counter())
    return bm.write_key(key,data)
}

async function get_points() {
    return bmreadcounter('points')
}

async function set_points(points) {
    return bmwritecounter('points',points)
}

async function add_point(point) {
    let points = await get_points()
    points[point.id] = point
    await set_points(points)
}

async function remove_point(point) {
    let points = await get_points()
    delete points[point.id]
    await set_points(points)
}

// ------------------------------------------------ DISPLAY

function create_new_point() {
    let today = Date.now()
    let id = Math.random()+''+today
    return {id:id,date:today}
}

async function display_points() {

    let points = await get_points()

    let color = '#'+(await get_current_counter()).color

    let container = $('.container').html('')
    .css('background','#'+(await get_current_counter()).color)
    $('meta[name=theme-color]').attr('content',color)

    let adder = $('<div>').addClass('points').css('background',color)
    let number = $('<div>').addClass('number').html(Object.keys(points).length)
    adder.append(number)

    let minner = $('<div>').addClass('depoints')

    let back = $('<div>').addClass('back btn')

    let remove = $('<div>').addClass('remove btn')
    .html('-')

    container.append(minner).append(adder).append(back).append(remove)

    adder.click(async function() {
        await add_point(create_new_point())
    })

    remove.click(async function() {
        await remove_counter(await get_current_counter())
        await go_back()
    })

    minner.click(async function() {
        let points = await get_points()
        let keys = Object.keys(points)
        if(keys.length > 0) {
            await remove_point(points[keys[keys.length-1]])
            await update_point_view()
        }
    })

    async function update_point_view() {
        let points = await get_points()
        number.html(Object.keys(points).length)
    }

    let regid = bm.register_checker('points!added',async function(new_point) {
        await update_point_view()
    })

    

    async function go_back() {
        await bm.unregister_checker(regid)
        await unset_current_counter()
        await display_points()
    }

    back.click(async function() {
        await go_back()
    })
}

async function ask_user_counter() {

    return new Promise(async function(ok){

        let regid = null

        function create_counter_caps(counter) {
            let caps_gx = $('<div>').addClass('counter')
            .html(counter.id).css('background','#'+counter.color)
            caps_gx.click(async function() {
                await bm.unregister_checker(regid)
                ok(counter)
            })
            return caps_gx
        }

        let container = $('.container').html('')
        .css('background','transparent')
        $('meta[name=theme-color]').attr('content','#fff')

        let adder = $('<div>').addClass('addCounter btn')
        .html('+')
        container.append(adder).append($('<div>').css('margin-top','70px'))

        let counters = await get_counters()
        if(Object.keys(counters).length == 0) {
            let announce = $('<div>').addClass('announce')
            .html('no counter, click to add')
            container.append(announce)
        }

        adder.click(async function() {
            let name = prompt('counter name')
            if(name == null) {
                return
            }
            let colors = ['1abc9c','2ecc71','3498db','9b59b6','16a085',
            '27ae60','2980b9','8e44ad','2c3e50','f1c40f','e67e22',
            'e74c3c','f39c12','c0392b','f39c12','34495e']
            let color = colors[parseInt(Math.random()*colors.length)]
            let counter = {id:name,color:color}
            console.log(counter)
            await add_counter(counter)
        })

        regid = bm.register_checker('counters!added',async function(name,counter) {
            let caps = create_counter_caps(counter)
            container.append(caps)
        })

    })
}

// ------------------------------------------------ CORE

async function main() {

    await display_points()

}

main()