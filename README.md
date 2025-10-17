# Recognition of Prior Learning (RPL) Approval Web-App System

## How to Run the Application

### Requirements
Python 3.12+, and Node.js 22.0+

### Docker setup
To test the Docker functionality, set `RPL-app` as your working directory, **make sure Docker is installed and running**, then run the following:
```
docker-compose build
docker-compose up
```
You can access the website using `127.0.0.1:3000` (or `localhost:3000`).
When you are finished, run
```
docker-compose down
```
This will keep your database intact.
If you want to delete everything **WARNING - this includes all images and volumes, including the database**, run the following instead: `docker-compose down --rmi all -v`.

### First-Time Setup (do this immediately after cloning the repository!)
1. Create a file `RPL-app/flask_api/.env` and insert the following text:
`FLASK_APP=api.py`
`FLASK_ENV=development`
1. Set up MongoDB on your computer through a means of your choice (I use MongoDB community edition with MongoDB Compass) and set up a connection on `localhost:27017` (if that port is busy, choose another one, and update the definition of the `mongo` variable in `api.py`.)
1. Navigate into `RPL-app` as your working directory, then run `npm install` to install Node dependencies.
1. Create a Python virtual environment for the Flask backend, as follows: You can do this in your terminal by navigating to `RPL-app/flask_api` as your working directory, creating the virtual environment with `python -m venv venv`, starting it by running the command `venv\Scripts\activate` (for Windows) or `source venv/bin/activate` (for Mac/Linux).
1. Then, import Python requirements into the venv using `pip install -r requirements.txt`. (Ensure your venv is in a `.gitignore` file - this may happen automatically, just make sure it happens.)
1. You are now ready to run the app.

### To run the application

1. In a terminal window, navigate to RPL-app/WebScraper folder, then run the command `npm i` then `npm run start`. This will initiate the Node for scraping the unit website's handbook. For instance, it opens an api proxy to establish connection on http://localhost:5174/api/uwa/{Unit Code}.
   
2. In the 2nd terminal window, run the Flask server by navigating to `RPL-app/flask_api`, activating your virtual environment, then navigating to `RPL-app/react_app` then running the command `npm run api`. ***IMPORTANT - you must have the virtual environment activated in this console, or this will not work.*** Then, leave this terminal open, and open a third terminal window to launch the React server.
  
3. In the 3rd terminal window, navigate to `RPL-app/react_app` as your working directory, then run the command `npm run dev` to start the React project. (You do not need the venv activated in this terminal.) Then, you can type `o + Enter` as a shortcut to open the server in your default browser, or use the URL provided in your console (by default, should be `http://localhost:5173`.)

Now, the app is running. Note that Hot-Module Reloading is in place, which means that if you edit any code files, you do not need to shut down and reopen the application, it should update automatically.

## Information about the Project

### Users and Stakeholders
- International Office  
- Program Chairs  
- Unit Coordinators  
- Students  
- Student Advising Office Staff  

### Pain Points
- Current approval system is **paper- and email-based**.  
- High effort required for reviewers.  
- Minimal use of **feedback and review loops** to refine decisions.  
- Number of requests is steadily **increasing**.  

### External Constraints
- **UWA Policy on RPL** (Policy Number: UP11/34 Recognition of Prior Learning).  
- **Accreditation (ACS) Conditions**: RPL not recognised for advanced units.  

### Current Process
1. **Student** fills in a form identifying:  
   - One UWA unit.  
   - One (or more) equivalent units from another institution.  

2. **Review** conducted by:  
   - Student Services.  
   - Program Chair and/or Unit Coordinator.  

3. **Decision outcomes**:  
   - Approved.  
   - Not Approved.  
   - Returned for More Information.  

### Review Considerations
- Learning outcomes.  
- Assessment items.  
- Syllabus.  
- Volume of learning.  
- Contextual information about:  
  - The institution.  
  - The student’s performance in the RPL unit.  

### Record Keeping
- Records must be kept so previously approved cases can be **retrieved and reapplied**.  

### Formal University Articulation Agreements
- Unit equivalences are approved via a **similar process**.  
- Recorded as part of the **Articulation Agreement contract**.  
- Difference:  
  - Articulation is **comprehensive** across course programs.  
  - RPL is **specific** to individual requests.  

### Review of Past Decisions
- **Currently not happening**.  
- Should include tracking student progress in subsequent units after RPL is granted.  
- Purpose:  
  - Identify if additional scaffolding is needed.  
  - Evaluate if RPL decisions were appropriate.  
  - Confirm positive outcomes.  
- Recommended: Review outcomes **annually** or every **two years**.  

### References and Related Work
- [UWA RPL Policy (UP11/34)](https://www.ask.uwa.edu.au/app/answers/detail/a_id/263/~/gaining-credit-for-your-prior-studies)  
- ACS Accreditation Section on Articulation Agreements.  
- UWA Credit Application Form.  
- ECU’s CRPL Database (useful reference).  
- University IT project: exploration of a **University-wide database of CRPL precedents**.  

### Developers
Ethan van Bruchem
Kelly Snow
Neicko Francisco
Tiselle Rayawang
Wenkao Sun
Yu Weng Choong




