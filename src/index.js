const express=require('express')
const path=require('path')
const socketio=require('socket.io')
const http=require('http')
const Filter=require('bad-words')
const {generateMessage,generateLocation}=require('./utils/message')
const {addUser,removeUser,getUser,getUsersInRoom}= require('./utils/users')

const port=process.env.PORT || 3000

const app=express()
const server=http.createServer(app)
const io=socketio(server)

const publicDirectoryPath=path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))
// let count=0
io.on('connection',(socket)=>{
    console.log('New web socket connection')


    ///////////////////basics of socket communication//////////////////////////
    // socket.emit('countUpdated',count)
    // socket.on('increment',()=>{
    //     count++
    //     //emits only to the particular socket connection
    //     // socket.emit('countUpdated',count)
    //     //emits to all socket connections
    //     io.emit('countUpdated',count)
    //     //emits to all sockets except the current one
    //     socket.broadcast.emit('countUpdated',count)
    // })
    ///////////////////basics of socket communication//////////////////////////

    //emits to all sockets except the current one
     socket.on('join',({username, room},callback)=>{
          const {error,user}=addUser({id:socket.id,username,room})
          if(error){
             return callback(error)
          }
          socket.join(user.room)

          socket.broadcast.to(room).emit('messageRecieved',generateMessage(`${user.username} has joined!`,'ChatIt!'))
          socket.emit('messageRecieved',generateMessage('Welcome to our chat app!','ChatIt!'))
          io.to(user.room).emit('roomData',{
              room:user.room,
              users:getUsersInRoom(user.room)
          })
          callback()
     })

     socket.on('sendMessage',(message,callback)=>{
         const filter=new Filter()
         filter.addWords('bc','mc')
         if(filter.isProfane(message)){
             return callback('Profanity is not allowed')
         }
         const user=getUser(socket.id)
         if(user){
         io.to(user.room).emit('messageRecieved',generateMessage(message,user.username))
         callback('Delivered!')}
     })

     socket.on('sendLocation',({latitude,longitude},callback)=>{
        const user=getUser(socket.id)
        if(user){
         io.to(user.room).emit('locationShared',generateLocation('https://google.com/maps?q='+latitude+','+longitude,user.username))
         callback()
     }})

     //triggered when socket connection closes
        socket.on('disconnect',()=>{
           const users= removeUser(socket.id)
           if(users){
            io.to(users[0].room).emit('messageRecieved',generateMessage(users[0].username+' has left!','ChatIt!'))
            io.to(users[0].room).emit('roomData',{
                room:users[0].room,
                users:getUsersInRoom(users[0].room)
            })
           }
         
        })
})

server.listen(port,()=>{
    console.log('Server is on port '+port)
})