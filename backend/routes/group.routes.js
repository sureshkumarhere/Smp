import express from 'express'
import {getGroups,getMessage,addMentor, addStudents, assignGroupsToMentors, getAllMembers, getAllMentors, getAllStudents, updateGroupDetails} from '../controllers/group.controller.js';
import isAdmin from '../middlewares/isAdmin.middleware.js';
import isAuthenticated from '../middlewares/isAuthenticated.middleware.js';
import isMentorOfGroup from '../middlewares/isMentorOfGroup.middleware.js';

const app = express.Router();

//  needed :
// 1. create group : details given like according to schema - name
//       is not given it comes by default
// 2. add one member : we can  member to group
// 3 . we are going to add members by the given csv list using the api-3
// 4. give all members in the group
// 5. give all mentors of the group
// 6. give all students of the group

// can do all the above things by using the schema of group only - using some queries

// 7. remove a participant from the group - only the mentor can do this
// 8. delete a group
// 9. update group details - name ( and may be avatar of group in future )


// 10. get all groups in which participant is present - we can directly get from user itself - no need to implement it 

app.post('/assigngroups', isAuthenticated , isAdmin ,  assignGroupsToMentors);
app.post('/updategroupdetails/:groupId', isAuthenticated, isMentorOfGroup, updateGroupDetails);
app.post('/addmentor/:groupId', isAuthenticated, isMentorOfGroup, addMentor);
app.post('/addstudents/:groupId', isAuthenticated, isMentorOfGroup, addStudents);
app.get('/allmembers/:groupId', isAuthenticated, isMentorOfGroup, getAllMembers);
app.get('/allmentors/:groupId', isAuthenticated, isMentorOfGroup, getAllMentors);
app.get('/allstudents/:groupId', isAuthenticated, isMentorOfGroup, getAllStudents);
app.get('/fetchgroups',isAuthenticated,getGroups);
app.get('/:groupId',isAuthenticated,getMessage);
export default app; 