//initialize socket connection with server
const socket=io()

///////////////////basics of socket communication//////////////////////////
//name should be same as declared in server-side code.
// socket.on('countUpdated',(count)=>{
//     console.log('count has been updated '+count  )
// })

// document.querySelector('#increment').addEventListener('click',()=>{
//     socket.emit('increment')
// })
///////////////////basics of socket communication//////////////////////////


const form=document.querySelector('#message-form')
const locationButton=document.querySelector('#location')
const formInput=form.querySelector('input')
const formButton=form.querySelector('button')
const messages=document.querySelector('#messages')

const messageTemplate=document.querySelector('#message-template').innerHTML
const locationTemplate=document.querySelector('#location-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

const{username,room}=Qs.parse(location.search,{ ignoreQueryPrefix:true})


socket.on('messageRecieved',(message)=>{
    console.log(message)
    const html=Mustache.render(messageTemplate,{message:message.text,createdAt:moment(message.createdAt).format('h:mm a'),username:message.username})
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})
socket.on('locationShared',(location)=>{
    console.log(location)
    const html=Mustache.render(locationTemplate,{url:location.url,createdAt:moment(location.createdAt).format('h:mm a'),username:location.username})
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()

})
socket.on('roomData',({room,users})=>{
  const html=Mustache.render(sidebarTemplate,{
      room,users
  })
  document.querySelector('#sidebar').innerHTML=html
})
form.addEventListener('submit',(e)=>{
    e.preventDefault()
    formButton.setAttribute('disabled','disabled')
    const message=formInput.value
    socket.emit('sendMessage',message,(reply)=>{
        console.log('Response: '+reply)
        formButton.removeAttribute('disabled')
        formInput.value=''
        formInput.focus()
    })
})

locationButton.addEventListener('click',()=>{
           if(!navigator.geolocation)
           return alert('Geolocation not supported by your browser')
           locationButton.setAttribute('disabled','disabled')
           navigator.geolocation.getCurrentPosition((position)=>{
               socket.emit('sendLocation',{
                   latitude:position.coords.latitude,
                   longitude:position.coords.longitude},()=>{
                       console.log('location shared')
                       locationButton.removeAttribute('disabled')
                   })
           })
})

socket.emit('join',{username,room},(error)=>{
   if(error){
       alert(error)
       location.href='/'
   }
})

const autoscroll=()=>{
    // new message element
    const newMessage=messages.lastElementChild

    //get height of newMessage
    const newMessageStyle=getComputedStyle(newMessage)
    const newMessageMargin=parseInt(newMessageStyle.marginBottom)
    const newMessageHeight=newMessage.offsetHeight+newMessageMargin

    const visibleHeight=messages.offsetHeight

    const containerHeight=messages.scrollHeight

    //how far i have scrolled
    const scrollOffset=messages.scrollTop+visibleHeight

    if(containerHeight-newMessageHeight<=scrollOffset){
         messages.scrollTop=messages.scrollHeight

}
}