const express=require('express');
const router=express.Router();
const {registerUser,loginUser,verifyUser,logoutUser}=require('../controllers/userController');
const {createSession,joinSession,exitSession,getUsers}=require('../controllers/roomController')
const authenticate=require('../middleware/authenticate');

router.post('/register',registerUser);
router.post('/login',loginUser);
router.get('/verify',verifyUser);
router.post('/logout',authenticate,logoutUser);
router.post('/createSession',authenticate,createSession)
router.post('/joinSession',authenticate,joinSession)
router.post('/exitSession',authenticate,exitSession)
router.post('/getUsers',authenticate,getUsers)


module.exports=router;