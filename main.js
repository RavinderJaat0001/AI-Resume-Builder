require('dotenv').config(); // If using .env for OpenAI key
const express = require('express')
const app = express()
const port = 3000
const path=require('path');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' }); // files go into /public/uploads

const { enhanceSummary } = require('./aiHelper');



const fs = require('fs'); // Required for template file checking

const session = require('express-session');

app.use(session({
  secret: 'your_secret_key', // use a strong secret in production
  resave: false,
  saveUninitialized: true
}));



app.set('view engine', 'ejs');


app.use(express.static(path.join(__dirname, 'public')));

// Set the view engine to EJS
app.set('views', path.join(__dirname, 'views')); 

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
}); 

// Serve FAQ page
app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'faq.html'));
});




app.get('/templates', (req, res) => {
  res.sendFile(__dirname +'/templateSection.html');
});


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public' +  '/editor.html');
});

app.get('/preview', (req, res) => {

  const selectedTemplate = req.query.template || 
  (req.app.locals.formData?.template); // Optional chaining

// Replace the templatePath check with:
const templatePath = path.join(__dirname, 'views', `${selectedTemplate}.ejs`);
try {
  if (!fs.existsSync(templatePath)) {
    return res.status(404).send(`Template "${selectedTemplate}.ejs" not found in views directory`);
  }
} catch (err) {
  console.error('Template path error:', err);
  return res.status(500).send('Internal server error');
}
  
const formData = req.session.formData || {};
// get saved form data
  formData.courses = formData.courses || [];  // ✅ This prevents EJS crash if courses is undefined
  formData.internships = formData.internships || [];
  formData.hobbies = formData.hobbies || '';
  formData.experience = formData.experience || [];
  formData.education = formData.education || [];





// Default empty values if missing
formData.skills = formData.skills || [];
formData.languages = formData.languages || [];
formData.fname = formData.fname || '';
formData.lname = formData.lname || '';
formData.perscity = formData.perscity || '';
formData.perscountry = formData.perscountry || '';
formData.pincode = formData.pincode || '';
formData.phoneno = formData.phoneno || '';
formData.email = formData.email || '';
formData.summary = formData.summary || '';
formData.jobtitle = formData.jobtitle || '';
formData.employer = formData.employer || '';
formData.expcity = formData.expcity || '';
formData.expcountry = formData.expcountry || '';
formData.startdate = formData.startdate || '';
formData.enddate = formData.enddate || '';
formData.degree = formData.degree || '';
formData.schoolname = formData.schoolname || '';
formData.schoollocation = formData.schoollocation || '';
formData.edustartdate = formData.edustartdate || '';
formData.eduenddate = formData.eduenddate || '';
formData.edusummary = formData.edusummary || '';

res.render(selectedTemplate, {
  ...formData, // Your existing form data
  imageURL: formData.imageURL || 'https://via.placeholder.com/120'  // ✅ Fix here
});
})

app.post('/ai/enhance-summary', express.json(), async (req, res) => {
  const { summary } = req.body;
  if (!summary) return res.status(400).json({ error: "No summary provided" });

  const enhanced = await enhanceSummary(summary);
  res.json({ enhanced });
});


app.post('/submit', upload.single('image'), async (req, res) => {
  const formData = req.body;

  // Enhance the summary using OpenAI
const rawSummary = formData.summary || '';
const enhancedSummary = await enhanceSummary(rawSummary);

    
   const selectedTemplate = formData.template; // Get template from form

   if (!selectedTemplate) {
    return res.status(400).send("No template selected - please go back and select a template");
  }

     


   const skillsArray =
  typeof formData.skills === 'string'
    ? formData.skills
        .split(/[,|\n]/) // support commas or newlines
        .map(skill => skill.trim())
        .filter(skill => skill !== '')
    : Array.isArray(formData.skills)
    ? formData.skills
    : [];

  
    const languagesArray = [];

if (formData.language && formData.level) {
  // For one language
  if (typeof formData.language === 'string') {
    languagesArray.push({ name: formData.language, level: formData.level });
  }
  // For multiple languages
  else if (Array.isArray(formData.language)) {
    for (let i = 0; i < formData.language.length; i++) {
      languagesArray.push({
        name: formData.language[i],
        level: formData.level[i]
      });
    }
  }
}
// Build the courses array
const courses = [];
if (
  formData.coursename &&
  formData.courseinstitution &&
  formData.coursestartdate &&
  formData.courseenddate
) {
  courses.push({
    coursename: formData.coursename,
    courseinstitution: formData.courseinstitution,
    coursestartDate: formData.coursestartdate,
    courseendDate: formData.courseenddate,
  });
}

// Change the internships processing to:
const internships = [];
if (
  formData.internjobtitle &&
  formData.internrecruiter &&
  formData.internstartdate &&
  formData.internenddate
) {
  internships.push({
    jobTitle: formData.internjobtitle,
    recruiter: formData.internrecruiter,
    city: formData.interncity || '',
    startDate: formData.internstartdate,
    endDate: formData.internenddate,
    description: formData.internshipsummary || ''
  });
}

const experience = [];

if (
  Array.isArray(formData.jobtitle) &&
  Array.isArray(formData.employer) &&
  Array.isArray(formData.startdate)
) {
  for (let i = 0; i < formData.jobtitle.length; i++) {
    experience.push({
      jobtitle: formData.jobtitle[i],
      employer: formData.employer[i],
      city: formData.expcity[i],
      country: formData.expcountry[i],
      startdate: formData.startdate[i],
      enddate: formData.enddate[i]
    });
  }
}

const languages = [];
if (Array.isArray(formData.language)) {
  for (let i = 0; i < formData.language.length; i++) {
    languages.push({
      name: formData.language[i],
      level: formData.level[i]
    });
  }
}

const education = [];
if (Array.isArray(formData.degree)) {
  for (let i = 0; i < formData.degree.length; i++) {
    education.push({
      degree: formData.degree[i],
      schoolname: formData.schoolname[i],
      schoollocation: formData.schoollocation[i],
      edustartdate: formData.edustartdate[i],
      eduenddate: formData.eduenddate[i],
      edusummary: formData.edusummary[i],
    });
  }
}


  // ✅ Robust image handling
  let imageURL = 'https://via.placeholder.com/120'; // Default fallback
  if (req.file) {
    imageURL = '/uploads/' + req.file.filename;
    console.log('Uploaded file saved at:', imageURL); // Debug log
  }
    






    // Prepare data to pass to the template
    const data = {
      fname: formData.fname || '',
      lname: formData.lname || '',
      perscity: formData.perscity || '',
      perscountry: formData.perscountry || '',
      pincode: formData.pincode || '',
      phoneno: formData.phoneno || '',
      email: formData.email || '',
      summary: enhancedSummary || '',
      skills: skillsArray,
      jobtitle: formData.jobtitle || '',
      employer: formData.employer || '',
      expcity: formData.expcity || '',
      expcountry: formData.expcountry || '',
      startdate: formData.startdate || '',
      enddate: formData.enddate || '',
      languages: languagesArray,
      courses: courses,
      internships:internships,
      hobbies: formData.hobbysummary || '', 
      experience,
      education,
      template: selectedTemplate,  // ✅ Critical: Preserve template selection
  imageURL: imageURL // Ensure imageURL is included

    };
    console.log('Template being used:', selectedTemplate); 
console.log('Image path:', imageURL);

  
  req.session.formData = {
    ...data, // Your existing processed data
    template: selectedTemplate // Preserve the template selection
  };

  // Redirect with template parameter
  res.redirect(`/preview?template=${selectedTemplate}`);

    console.log('Received formData:', req.body);
console.log('Processed skills:', skillsArray);
console.log('Processed languages:', languagesArray);


  })

  app.get('/reset', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });
  
  






  



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

