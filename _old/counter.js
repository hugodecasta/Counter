'use strict'

// ------------------------------------------------ VAR

var bm = new BoolMaster('BoolMaster/api.php')
var gsi = new GoogleSignIn('1070660703362-5m1lo7rov7tn5ubo8oti29i7aqvu89ju.apps.googleusercontent.com')
var user_mirror = null
var counter_mirror = null

// ------------------------------------------------ MIRROR

async function set_user_mirror() {
    if(user_mirror == null) {
        let user_id = await gsi.get_profile_data()
        user_id = user_id.id
        user_mirror = new Mirror('user'+user_id,bm)
    }
    return user_mirror
}

async function set_counter_mirror() {

    if(counter_mirror == null) {
        let counter_id = await get_current_counter()
        counter_id = counter_id.id
        counter_mirror = new Mirror('counter'+counter_id,bm)
    }
    return counter_mirror
}

// ------------------------------------------------ DATA

async function get_current_counter() {

    await set_user_mirror()

    let current_counter = user_mirror.get([],'current_counter',null)
    if(current_counter == null) {
        let current = await ask_user_counter()
        user_mirror.set([],'current_counter',current)
    }
    return user_mirror.get([],'current_counter')
}

// ------------------------------------------------ DISPLAY

function create_new_point() {
    let today = Date.now()
    let id = Math.random()+''+today
    return {id:id,date:today}
}

async function display_points() {

    let go_back = null

    let current_counter = await get_current_counter()
    await set_counter_mirror()

    // -- JQ

    let container = $('.container').html('')

    let adder = $('<div>').addClass('points')
    let number = $('<div>').addClass('number')
    adder.append(number)

    let minner = $('<div>').addClass('depoints')
    let back = $('<div>').addClass('back btn')
    let remove = $('<div>').addClass('remove btn').html('-')

    container.append(minner).append(adder).append(back).append(remove)

    // --- EVT

    adder.click(function() {
        let point = create_new_point()
        counter_mirror.set(['points'], point.id, point)
    })

    minner.click(async function() {
        let points = counter_mirror.get([],'points')
        let keys = Object.keys(points)
        if(keys.length > 0) {
            counter_mirror.del(['points'],keys[keys.length-1])
        }
    })

    remove.click(function() {
        user_mirror.set([],'current_counter',null)
        user_mirror.del(['counters'],current_counter.id)
    })

    back.click(function() {
        user_mirror.set([],'current_counter',null)
        go_back()
    })

    // --- MIRROR

    user_mirror.on('del_prop',['counter'],current_counter.id,function() {
        go_back()
    })

    user_mirror.on_prop('set_prop',['counter',current_counter.id],'color',function(new_color) {
        let color = '#'+new_color
        adder.css('background',color)
        back.css('color',color)
        remove.css('color',color)
        container.css('background',color)
        $('meta[name=theme-color]').attr('theme-color',color)
    })

    counter_mirror.on('new_prop',['points'],function(id, new_point) {
        let points = get_counter_mirror().get([],'points')
        number.html(Object.keys(points).length)
    })

    return new Promise((ok)=>{
        go_back = ok
    })
}

async function ask_user_counter() {

    return new Promise(async function(ok){

        function create_counter_caps(counter) {
            let caps_gx = $('<div>').addClass('counter')
            .html(counter.id).css('background','#'+counter.color)
            caps_gx.click(async function() {
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

        let counters = user_mirror.get([],'counters')
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
            user_mirror.set(['counters'],counter.id,counter)
        })

        user_mirror.on('new_prop',['counters'],function(prop, counter){
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