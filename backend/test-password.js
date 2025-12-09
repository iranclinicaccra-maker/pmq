const bcrypt = require('bcrypt');

const hash = '$2b$10$/OZCWQ/DFa2O/LMa0O7IyumshXipq1UBXy5MSdlXRiaPXWKgPCl6K';
const password = 'admin';

bcrypt.compare(password, hash).then(result => {
    console.log('Password "admin" matches hash:', result);
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
