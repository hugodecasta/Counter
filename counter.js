'use strict'

// ------------------------------------------- TO CHANGE

function round_button(icon,type='fab',more_class='') {
    let btn = $('<button>').addClass(more_class)
    .addClass('mdl-button mdl-js-button')
    .addClass('mdl-button--'+type+' mdl-js-ripple-effect')
    .css('margin',10)
    let icon_div =$('<i>').addClass('material-icons').html(icon)
    btn.append(icon_div)
    return btn
}

function text_button(text,type='raised',more_class='') {
    let btn = $('<button>').addClass(more_class)
    .addClass('mdl-button mdl-js-button')
    .addClass('mdl-button--'+type+' mdl-js-ripple-effect')
    .css('margin',10).html(text)
    return btn
}

// ------------------------------------------- VAR

var gsi = new GoogleSignIn('1070660703362-5m1lo7rov7tn5ubo8oti29i7aqvu89ju.apps.googleusercontent.com')
var bm = new BoolMaster('BoolMaster/api.php')
var mirror = new Mirror(bm)

// ------------------------------------------- DATA

async function get_current_counter_id() {
    let list_connector = await get_list_connecter()
    let current_id = list_connector.get([],'current_counter_id',null)
    if(current_id == null) {
        let current = await disp_counters()
        current_id = current.id
        list_connector.set([],'current_counter_id',current_id)
        return await get_current_counter_id()
    }
    return current_id
}

// ------------------------------------------- MIRROR

async function get_list_connecter() {
    let profile = await gsi.get_profile_data()
    let connect_name = profile.id+'list'
    await mirror.create_base(connect_name)
    let obj = await mirror.connect(connect_name)
    obj.reset_waiters()
    return obj
}

async function get_counter_connector(counter_id) {
    let obj = await mirror.connect(counter_id)
    obj.reset_waiters()
    return obj
}

// ------------------------------------------- DISP

async function disp_counters() {

    return new Promise(async function(give_counter) {

        let list_connector = await get_list_connecter()

        // --- JQ

        $('.container').html('')
        .css('background','transparent')
        $('meta[name=theme-color]').attr('content','#fff')

        let addbtn = round_button('add','fab','mdl-button--colored')
        let linkbtn = round_button('link','flat','mdl-button--colored')
        $('.container').append(addbtn).append(linkbtn).append('<br>')

        // --- FCT

        function link_counter(counter_id) {
            list_connector.set(['counters'],counter_id,{id:counter_id})
        }

        // --- BTN

        addbtn.click(async function() {
            let name = prompt('name')
            if(name == null) {
                return
            }
            let id = parseInt(Math.random()*100000)+name
            let colors = ['1abc9c','2ecc71','3498db','9b59b6','16a085',
            '27ae60','2980b9','8e44ad','2c3e50','f1c40f','e67e22',
            'e74c3c','f39c12','c0392b','f39c12','34495e']
            let color = colors[parseInt(Math.random()*colors.length)]
            let counter = {
                id,
                name,points:{},
                disp_mode:'second',
                color
            }
            await mirror.create_base(id)
            let counter_connector = await get_counter_connector(id)
            counter_connector.set_base(counter)
            link_counter(id)
        })

        linkbtn.click(async function() {
            let id = prompt('counter shared token')
            if(id == null) {
                return
            }
            link_counter(id)
        })

        // --- EVT

        list_connector.on_path('add',['counters'],async function(cid, counter) {

            let counter_connector = await get_counter_connector(counter.id)

            let btn = $('<div>').addClass('counter')
            $('.container').append(btn)

            btn.click(function() {
                give_counter(counter)
            })

            list_connector.on_prop('del',['counters'],cid,function() {
                btn.remove()
            })
            counter_connector.on_prop('set',[],'color',function(new_color) {
                console.log(new_color)
                btn.css('background','#'+new_color)
            })
            counter_connector.on_prop('set',[],'name',function(new_name) {
                btn.html(new_name)
            })
            counter_connector.on_event('del_base',function() {
                list_connector.del(['counters'],cid)
            })
        })

    })
}

async function disp_points() {

    return new Promise(async function(end) {

        let current_counter_id = await get_current_counter_id()
        let counter_connector = await get_counter_connector(current_counter_id)

        // --- JQ

        $('.container').html('')

        let back = round_button('arrow_back','fab','incounter')
        let linker = round_button('link','flat','incounter')

        let name = text_button('','flat')

        let points = $('<div>').addClass('points')
        let number = $('<div>').addClass('number')
        points.append(number)

        let minner = $('<div>').addClass('depoints')

        let remove = round_button('delete','fab','remove incounter')

        $('.container')
        .append(back).append(linker)
        //.append(name)
        .append(minner).append(points)
        .append(remove)

        // --- FCT

        async function go_back() {
            let list_connector = await get_list_connecter()
            list_connector.del([],'current_counter_id')
            end()
        }

        function upd_point_count() {
            let len = Object.keys(counter_connector.get([],'points')).length
            number.html(len)
        }

        function set_display_mode(mode) {
            let points = counter_connector.get([],'points')
            let func = display_curves[mode]
            let disp_curve = func(points)
            display_mode.val(mode)
            set_display(disp_curve)
        }

        function set_display(curve) {
            display.html(JSON.stringify(curve))
        }

        // --- INNER

        let display_curves = {
            'second':function(points) {
                return [1,2,3]
            },
            'minute':function(points) {
                return [3,2,1]
            }
        }

        function init_display_mode() {    
            for(let disp_option in display_curves) {
                let option = $('<option>').attr('value',disp_option).html(disp_option)
                display_mode.append(option)
            }
        }

        // --- BTN

        name.click(function() {
            let new_name = prompt('new name',counter_connector.get([],'name'))
            if(new_name == null) {
                return
            }
            counter_connector.set([],'name',new_name)
        })

        back.click(go_back)

        linker.click(function() {
            let id = counter_connector.get([],'id')
            prompt('shared token',id)
        })

        points.click(function() {
            let now = Date.now()
            let id = Math.random()+''+now
            let point = {id,now}
            counter_connector.set(['points'],id,point)
        })

        minner.click(function() {
            let keys = Object.keys(counter_connector.get([],'points'))
            if(keys.length > 0) {
                counter_connector.del(['points'],keys[keys.length-1])
            }
        })

        remove.click(async function() {
            if(confirm('remove counter ?')) {
                counter_connector.delete()
            }
        })

        // --- EVT
        
        counter_connector.on_event('del_base',function() {
            go_back()
        })
        
        counter_connector.on_prop('set',[],'name',function(new_name) {
            //name.html(new_name)
        })
        
        counter_connector.on_prop('set',[],'color',function(new_color) {
            let color = '#'+new_color
            points.css('background',color)
            back.css('color',color)
            remove.css('color',color)
            $('.container').css('background',color)
            $('meta[name=theme-color]').attr('content',color)
        })
        
        counter_connector.on_prop('set',[],'disp_mode',function(mode) {
            //set_display_mode(mode)
        })
        
        counter_connector.on_prop('add',[],'points',function() {
            upd_point_count()
        })
        
        counter_connector.on_path('add',['points'],function(pid, point) {
            upd_point_count()
        })
        
        counter_connector.on_path('del',['points'],function() {
            upd_point_count()
        })
    })

}

// ------------------------------------------- CORE

async function satisfy_user() {
    while(true) {
        await disp_points()
    }
}

async function main() {
    await satisfy_user()
    location.reload()
}

main()