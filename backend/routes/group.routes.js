import express from 'express'

const app = express.Router();

//  needed :
// 1. create group : details given like according to schema - name
//       is not given it comes by default
// 2. add one member : we can  member to group
// 3 . we are going to add members by the given csv list using the api-3
// 4. give all members in the group
// 5. give all mentors of the group
// 6. give all students of the group
// 7. remove a participant from the group - only the mentor can do this
// 8. delete a group
// 9. update group details - name ( and may be avatar of group in future )
// 10. get all groups in which participant is present - we can directly get from user itself - no need to implement it 

app.post('/new' )


export default app; 