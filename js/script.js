import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";

/* =========================================
   JOBNEST - MAIN JAVASCRIPT
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       HERO SEARCH
    ========================================= */

    const searchForm = document.getElementById("hero-search-form");
    const keywordInput = document.getElementById("hero-keyword");
    const locationInput = document.getElementById("hero-location");

    if (searchForm) {
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const keyword = keywordInput?.value.trim() || "";
            const location = locationInput?.value.trim() || "";

            const params = new URLSearchParams();

            if (keyword) {
                params.set("keyword", keyword);
            }

            if (location) {
                params.set("location", location);
            }

            window.location.href =
                `jobs.html${params.toString() ? "?" + params.toString() : ""}`;
        });
    }


    /* =========================================
       SAVED JOBS - HOME PAGE
    ========================================= */

    let savedJobs = JSON.parse(
        localStorage.getItem("jobnestSavedJobs") || "[]"
    );

    const saveButtons = document.querySelectorAll(".save-job");

    saveButtons.forEach((button) => {

        const jobCard = button.closest(".job-card");

        if (!jobCard) return;

        const jobTitle =
            jobCard.querySelector("h3")?.textContent.trim() || "";

        const company =
            jobCard.querySelector(".company-name")?.textContent.trim() || "";

        const jobId = `${jobTitle}-${company}`.toLowerCase();

        updateSaveButton(button, jobId);

        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            const existingIndex = savedJobs.findIndex(
                (job) => job.id === jobId
            );

            if (existingIndex !== -1) {
                savedJobs.splice(existingIndex, 1);
            } else {
                savedJobs.push({
                    id: jobId,
                    title: jobTitle,
                    company: company
                });
            }

            localStorage.setItem(
                "jobnestSavedJobs",
                JSON.stringify(savedJobs)
            );

            updateSaveButton(button, jobId);
        });
    });


    function updateSaveButton(button, jobId) {

        const isSaved = savedJobs.some(
            (job) => job.id === jobId
        );

        button.textContent = isSaved ? "Saved" : "Save";

        if (isSaved) {
            button.setAttribute("aria-label", "Remove saved job");
        } else {
            button.setAttribute("aria-label", "Save job");
        }
    }


    /* =========================================
       JOBS PAGE
       SEARCH + FILTERS + SORT
    ========================================= */

    const jobsList = document.getElementById("jobs-list");

    if (jobsList) {

        let jobCards = Array.from(
            jobsList.querySelectorAll(".job-list-card")
        );

        const jobSearch =
            document.getElementById("job-search");

        const locationSearch =
            document.getElementById("location-search");

        const searchJobsBtn =
            document.getElementById("search-jobs-btn");

        const sortJobs =
            document.getElementById("sort-jobs");

        const clearFilters =
            document.getElementById("clear-filters");

        const resetJobs =
            document.getElementById("reset-jobs");

        const noJobsMessage =
            document.getElementById("no-jobs-message");

        const jobsCount =
            document.getElementById("jobs-count");

        const categoryFilters =
            document.querySelectorAll(".category-filter");

        const typeFilters =
            document.querySelectorAll(".type-filter");

        const modeFilters =
            document.querySelectorAll(".mode-filter");


        /* =========================================
           READ URL SEARCH
        ========================================= */

        const urlParams =
            new URLSearchParams(window.location.search);

        const urlKeyword =
            urlParams.get("keyword") || "";

        const urlLocation =
            urlParams.get("location") || "";

        if (jobSearch && urlKeyword) {
            jobSearch.value = urlKeyword;
        }

        if (locationSearch && urlLocation) {
            locationSearch.value = urlLocation;
        }


        /* =========================================
           FILTER JOBS
        ========================================= */

        function filterJobs() {

            const keyword =
                jobSearch?.value.trim().toLowerCase() || "";

            const location =
                locationSearch?.value.trim().toLowerCase() || "";


            const selectedCategories =
                Array.from(categoryFilters)
                    .filter((checkbox) => checkbox.checked)
                    .map((checkbox) =>
                        checkbox.value.toLowerCase()
                    );


            const selectedTypes =
                Array.from(typeFilters)
                    .filter((checkbox) => checkbox.checked)
                    .map((checkbox) =>
                        checkbox.value.toLowerCase()
                    );


            const selectedModes =
                Array.from(modeFilters)
                    .filter((checkbox) => checkbox.checked)
                    .map((checkbox) =>
                        checkbox.value.toLowerCase()
                    );


            let visibleJobs = [];


            jobCards.forEach((card) => {

                const title =
                    card.dataset.title?.toLowerCase() || "";

                const category =
                    card.dataset.category?.toLowerCase() || "";

                const type =
                    card.dataset.type?.toLowerCase() || "";

                const mode =
                    card.dataset.mode?.toLowerCase() || "";

                const cardLocation =
                    card.dataset.location?.toLowerCase() || "";


                const matchesKeyword =
                    !keyword ||
                    title.includes(keyword) ||
                    category.includes(keyword);


                const matchesLocation =
                    !location ||
                    cardLocation === location;


                const matchesCategory =
                    selectedCategories.length === 0 ||
                    selectedCategories.includes(category);


                const matchesType =
                    selectedTypes.length === 0 ||
                    selectedTypes.includes(type);


                const matchesMode =
                    selectedModes.length === 0 ||
                    selectedModes.includes(mode);


                const shouldShow =
                    matchesKeyword &&
                    matchesLocation &&
                    matchesCategory &&
                    matchesType &&
                    matchesMode;


                if (shouldShow) {

                    card.style.display = "grid";
                    visibleJobs.push(card);

                } else {

                    card.style.display = "none";

                }

            });


            /* =========================================
               UPDATE JOB COUNT
            ========================================= */

            if (jobsCount) {

                jobsCount.textContent =
                    `${visibleJobs.length} ${
                        visibleJobs.length === 1
                            ? "opportunity"
                            : "opportunities"
                    } found`;

            }


            /* =========================================
               NO RESULTS
            ========================================= */

            if (noJobsMessage) {

                if (visibleJobs.length === 0) {
                    noJobsMessage.style.display = "block";
                } else {
                    noJobsMessage.style.display = "none";
                }

            }

        }


        /* =========================================
           SEARCH BUTTON
        ========================================= */

        if (searchJobsBtn) {

            searchJobsBtn.addEventListener("click", () => {

                filterJobs();

                const params =
                    new URLSearchParams();

                const keyword =
                    jobSearch?.value.trim() || "";

                const location =
                    locationSearch?.value.trim() || "";


                if (keyword) {
                    params.set("keyword", keyword);
                }

                if (location) {
                    params.set("location", location);
                }


                const newUrl =
                    `${window.location.pathname}${
                        params.toString()
                            ? "?" + params.toString()
                            : ""
                    }`;

                window.history.replaceState(
                    {},
                    "",
                    newUrl
                );

            });

        }


        /* =========================================
           SEARCH WITH ENTER
        ========================================= */

        if (jobSearch) {

            jobSearch.addEventListener(
                "keydown",
                (event) => {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        searchJobsBtn?.click();

                    }

                }
            );

        }


        /* =========================================
           LOCATION CHANGE
        ========================================= */

        if (locationSearch) {

            locationSearch.addEventListener(
                "change",
                filterJobs
            );

        }


        /* =========================================
           CHECKBOX FILTERS
        ========================================= */

        categoryFilters.forEach((checkbox) => {

            checkbox.addEventListener(
                "change",
                filterJobs
            );

        });


        typeFilters.forEach((checkbox) => {

            checkbox.addEventListener(
                "change",
                filterJobs
            );

        });


        modeFilters.forEach((checkbox) => {

    checkbox.addEventListener(
        "change",
        filterJobs
    );

});


/* =========================================
   APPLY INITIAL FILTERS
========================================= */

filterJobs();
        /* =========================================
           SORT JOBS
        ========================================= */

        if (sortJobs) {

            sortJobs.addEventListener(
                "change",
                () => {

                    const sortValue =
                        sortJobs.value;


                    if (sortValue === "salary-high") {

                        jobCards.sort(
                            (a, b) =>
                                Number(b.dataset.salary || 0) -
                                Number(a.dataset.salary || 0)
                        );

                    }


                    if (sortValue === "salary-low") {

                        jobCards.sort(
                            (a, b) =>
                                Number(a.dataset.salary || 0) -
                                Number(b.dataset.salary || 0)
                        );

                    }


                    if (sortValue === "latest") {

                        jobCards.sort(
                            (a, b) =>
                                jobCards.indexOf(a) -
                                jobCards.indexOf(b)
                        );

                    }


                    jobCards.forEach((card) => {
                        jobsList.appendChild(card);
                    });


                    filterJobs();

                }
            );

        }


        /* =========================================
           CLEAR ALL FILTERS
        ========================================= */

        if (clearFilters) {

            clearFilters.addEventListener(
                "click",
                () => {

                    if (jobSearch) {
                        jobSearch.value = "";
                    }

                    if (locationSearch) {
                        locationSearch.value = "";
                    }


                    categoryFilters.forEach(
                        (checkbox) => {
                            checkbox.checked = false;
                        }
                    );


                    typeFilters.forEach(
                        (checkbox) => {
                            checkbox.checked = false;
                        }
                    );


                    modeFilters.forEach(
                        (checkbox) => {
                            checkbox.checked = false;
                        }
                    );


                    if (sortJobs) {
                        sortJobs.value = "latest";
                    }


                    window.history.replaceState(
                        {},
                        "",
                        window.location.pathname
                    );


                    filterJobs();

                }
            );

        }


        /* =========================================
           RESET SEARCH
        ========================================= */

        if (resetJobs) {

            resetJobs.addEventListener(
                "click",
                () => {

                    clearFilters?.click();

                }
            );

        }


        /* =========================================
           JOBS PAGE SAVE BUTTONS
        ========================================= */

        const jobsSaveButtons =
            document.querySelectorAll(".save-job-btn");


        jobsSaveButtons.forEach((button) => {

            const jobCard =
                button.closest(".job-list-card");

            if (!jobCard) return;


            const jobTitle =
                jobCard.dataset.title || "";

            const company =
                jobCard.querySelector(
                    ".job-company"
                )?.textContent.trim() || "";


            const jobId =
                `${jobTitle}-${company}`.toLowerCase();


            updateJobPageSaveButton(
                button,
                jobId
            );


            button.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();
                    event.stopPropagation();


                    const existingIndex =
                        savedJobs.findIndex(
                            (job) =>
                                job.id === jobId
                        );


                    if (existingIndex !== -1) {

                        savedJobs.splice(
                            existingIndex,
                            1
                        );

                    } else {

                        savedJobs.push({
                            id: jobId,
                            title: jobTitle,
                            company: company
                        });

                    }


                    localStorage.setItem(
                        "jobnestSavedJobs",
                        JSON.stringify(savedJobs)
                    );


                    updateJobPageSaveButton(
                        button,
                        jobId
                    );

                }
            );

        });


        function updateJobPageSaveButton(
            button,
            jobId
        ) {

            const isSaved =
                savedJobs.some(
                    (job) =>
                        job.id === jobId
                );


            button.textContent =
                isSaved ? "Saved" : "Save";


            if (isSaved) {

                button.classList.add("saved");

            } else {

                button.classList.remove("saved");

            }

        }


        /* =========================================
           LOAD FIRESTORE JOBS
        ========================================= */

        async function loadFirestoreJobs() {

            try {

                const snapshot =
                    await getDocs(collection(db, "jobs"));

                snapshot.forEach((docSnapshot) => {

                    const job =
                        docSnapshot.data();

                    if (job.status === "Closed") {
                        return;
                    }

                    const companyName =
                        job.company || "Company";

                    const initials =
                        companyName
                            .split(" ")
                            .map((word) => word.charAt(0))
                            .join("")
                            .substring(0, 2)
                            .toUpperCase();

                    const salaryText =
                        job.salary || "Salary not specified";

                    const salaryNumber =
                        Number(
                            (salaryText.match(/\d+/) || ["0"])[0]
                        );

                    const card =
                        document.createElement("article");

                    card.className =
                        "job-list-card";

                    card.dataset.category =
                        job.category || "";

                    card.dataset.type =
                        job.type || "";

                    card.dataset.mode =
                        job.mode || "";

                    card.dataset.location =
                        job.location || "";

                    card.dataset.title =
                        job.title || "";

                    card.dataset.salary =
                        salaryNumber;

                    card.innerHTML = `
                        <div class="job-list-image">
                            <img
                                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
                                alt="Job opportunity"
                            >
                        </div>

                        <div class="job-list-content">

                            <div class="job-list-top">

                                <div class="company-logo-small">
                                    ${initials}
                                </div>

                                <button
                                    type="button"
                                    class="save-job-btn"
                                    data-job="${docSnapshot.id}"
                                >
                                    Save
                                </button>

                            </div>

                            <h3>${job.title || "Job Position"}</h3>

                            <p class="job-company">
                                ${companyName}
                            </p>

                            <div class="job-details-row">
                                <span>${job.type || "Not specified"}</span>
                                <span>${job.location || "Not specified"}</span>
                                <span>${job.category || "General"}</span>
                            </div>

                            <div class="job-card-bottom">

                                <strong>
                                    ${salaryText}
                                </strong>

                                <a href="job-details.html?id=${docSnapshot.id}">
                                    View Job →
                                </a>

                            </div>

                        </div>
                    `;

                    jobsList.appendChild(card);

                });

                jobCards =
                    Array.from(
                        jobsList.querySelectorAll(".job-list-card")
                    );

                filterJobs();

            } catch (error) {

                console.error(
                    "Error loading Firestore jobs:",
                    error
                );

            }

        }

        loadFirestoreJobs();


        /* =========================================
           INITIAL FILTER
        ========================================= */

        filterJobs();

    }


    /* =========================================
       POPULAR SEARCH LINKS
    ========================================= */

    const popularLinks =
        document.querySelectorAll(
            ".popular-searches a"
        );


    popularLinks.forEach((link) => {

        link.addEventListener("click", () => {

            const url =
                new URL(
                    link.href,
                    window.location.origin
                );


            const keyword =
                url.searchParams.get("keyword");


            if (keyword) {

                localStorage.setItem(
                    "jobnestLastSearch",
                    keyword
                );

            }

        });

    });


    /* =========================================
       SIMPLE SCROLL ANIMATION
    ========================================= */

    const animatedItems =
        document.querySelectorAll(
            ".category-card, .job-card, .company-card, .resource-link"
        );


    if ("IntersectionObserver" in window) {

        const observer =
            new IntersectionObserver(
                (entries) => {

                    entries.forEach((entry) => {

                        if (entry.isIntersecting) {

                            entry.target.style.opacity =
                                "1";

                            entry.target.style.transform =
                                "translateY(0)";

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.12
                }
            );


        animatedItems.forEach((item) => {

            item.style.opacity = "0";

            item.style.transform =
                "translateY(20px)";

            item.style.transition =
                "opacity 0.5s ease, transform 0.5s ease";

            observer.observe(item);

        });

    }


    /* =========================================
       ACTIVE NAVIGATION
    ========================================= */

    const currentPage =
        window.location.pathname
            .split("/")
            .pop() || "index.html";


    const navigationLinks =
        document.querySelectorAll(
            ".nav-links a"
        );


    navigationLinks.forEach((link) => {

        const linkPage =
            link.getAttribute("href")
                ?.split("?")[0];


        if (linkPage === currentPage) {

            link.classList.add("active");

        }

    });


    /* =========================================
       LOG
    ========================================= */

    console.log(
        "JobNest frontend initialized successfully."
    );

});

/* =====================================================
   JOB DETAILS DATA
===================================================== */

const jobDetailsData = {

    "frontend-developer": {
        title: "Frontend Developer",
        company: "TechNova",
        logo: "TE",
        location: "Lahore",
        type: "Full-time",
        mode: "On-site",
        category: "IT",
        salary: "PKR 150k – 250k / month",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        description:
            "We are looking for a talented Frontend Developer to create modern, responsive, and user-friendly web applications. You will work with designers and backend developers to build high-quality digital experiences.",
        companyDescription:
            "TechNova is a growing technology company focused on building modern software products and digital solutions."
    },

    "backend-engineer": {
        title: "Backend Engineer",
        company: "TechNova",
        logo: "TE",
        location: "Remote",
        type: "Full-time",
        mode: "Remote",
        category: "IT",
        salary: "PKR 250k – 400k / month",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
        description:
            "TechNova is looking for a Backend Engineer to develop reliable APIs, server-side applications, and database solutions. You will help build secure and scalable systems used by modern digital products.",
        companyDescription:
            "TechNova is a growing technology company focused on building modern software products and digital solutions."
    },

    "digital-marketing": {
        title: "Digital Marketing Executive",
        company: "BrightEdge Media",
        logo: "BR",
        location: "Karachi",
        type: "Full-time",
        mode: "On-site",
        category: "Marketing",
        salary: "PKR 80k – 120k / month",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
        description:
            "BrightEdge Media is seeking a creative Digital Marketing Executive to help develop marketing campaigns, manage digital channels, and improve online engagement.",
        companyDescription:
            "BrightEdge Media is a creative marketing company helping brands grow through digital campaigns and modern marketing strategies."
    },

    "ui-ux-designer": {
        title: "UI/UX Designer",
        company: "PixelCraft Studio",
        logo: "PI",
        location: "Islamabad",
        type: "Full-time",
        mode: "On-site",
        category: "Design",
        salary: "PKR 120k – 200k / month",
        image: "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=80",
        description:
            "PixelCraft Studio is looking for a UI/UX Designer who can transform ideas into simple, attractive, and user-friendly digital experiences.",
        companyDescription:
            "PixelCraft Studio is a creative design studio specializing in user interfaces, digital experiences, and visual design."
    },

    "financial-analyst": {
        title: "Financial Analyst",
        company: "FinTrust Bank",
        logo: "FI",
        location: "Lahore",
        type: "Full-time",
        mode: "On-site",
        category: "Finance",
        salary: "PKR 130k – 190k / month",
        image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
        description:
            "FinTrust Bank is seeking a Financial Analyst to analyze financial information, prepare reports, and support business decision-making through accurate data analysis.",
        companyDescription:
            "FinTrust Bank provides financial services and solutions while supporting businesses and individuals with modern banking products."
    },

    "online-math-tutor": {
        title: "Online Math Tutor",
        company: "EduSpark",
        logo: "ED",
        location: "Remote",
        type: "Part-time",
        mode: "Remote",
        category: "Education",
        salary: "PKR 40k – 70k / month",
        image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
        description:
            "EduSpark is looking for an enthusiastic Online Math Tutor to teach students through engaging online lessons and help them develop strong mathematical skills.",
        companyDescription:
            "EduSpark is an education platform focused on accessible online learning and helping students improve their academic skills."
    }

};


/* =====================================================
   LOAD SELECTED JOB
===================================================== */

async function loadJobDetails() {

    const jobTitleElement = document.getElementById("detail-job-title");

    if (!jobTitleElement) {
        return;
    }

    const params = new URLSearchParams(window.location.search);

    const jobId =
    params.get("id") ||
    params.get("job") ||
    "frontend-developer";

   const jobRef = doc(db, "jobs", jobId);

const jobSnapshot = await getDoc(jobRef);

const job = jobSnapshot.exists()
    ? jobSnapshot.data()
    : null;

    if (!job) {
        return;
    }


    /* JOB TITLE */

    const title = document.getElementById("detail-job-title");

    if (title) {
        title.textContent = job.title;
    }


    /* COMPANY */

    const company = document.getElementById("detail-company");

    if (company) {
        company.textContent = job.company;
    }


    /* COMPANY LOGO */

    const logo = document.getElementById("detail-company-logo");

    if (logo) {
        logo.textContent = job.logo;
    }


    /* JOB IMAGE */

    const image = document.getElementById("detail-job-image");

    if (image) {
        image.src = job.image;
        image.alt = job.title;
    }


    /* DESCRIPTION */

    const description = document.getElementById("detail-description");

    if (description) {
        description.textContent = job.description;
    }


    /* JOB TYPE */

    const type = document.getElementById("detail-job-type");

    if (type) {
        type.textContent = job.type;
    }


    /* LOCATION */

    const location = document.getElementById("detail-location");

    if (location) {
        location.textContent = job.location;
    }


    /* WORK MODE */

    const mode = document.getElementById("detail-work-mode");

    if (mode) {
        mode.textContent = job.mode;
    }


    /* CATEGORY */

    const category = document.getElementById("detail-category");

    if (category) {
        category.textContent = job.category;
    }


    /* SALARY */

    const salary = document.getElementById("detail-salary");

    if (salary) {
        salary.textContent = job.salary;
    }


    /* SIDEBAR COMPANY LOGO */

    const sidebarLogo =
        document.getElementById("sidebar-company-logo");

    if (sidebarLogo) {
        sidebarLogo.textContent = job.logo;
    }


    /* SIDEBAR COMPANY NAME */

    const sidebarCompany =
        document.getElementById("sidebar-company-name");

    if (sidebarCompany) {
        sidebarCompany.textContent = job.company;
    }


    /* SIDEBAR COMPANY DESCRIPTION */

    const sidebarDescription =
        document.getElementById("sidebar-company-description");

    if (sidebarDescription) {
        sidebarDescription.textContent =
            job.companyDescription;
    }


    /* PAGE TITLE */

    document.title = `${job.title} | JobNest`;


        /* SAVE BUTTON */

    const saveButton =
        document.getElementById("detail-save-job");

    if (saveButton && auth.currentUser) {

        const savedJobsSnapshot =
            await getDocs(collection(db, "savedJobs"));

        const existingSavedJob =
            savedJobsSnapshot.docs.find(savedDoc => {

                const savedData = savedDoc.data();

                return (
                    savedData.userId === auth.currentUser.uid &&
                    savedData.jobId === jobId
                );

            });

        if (existingSavedJob) {
            saveButton.textContent = "Saved";
            saveButton.classList.add("saved");
        }

        saveButton.addEventListener(
            "click",
            async function () {

                const currentSnapshot =
                    await getDocs(collection(db, "savedJobs"));

                const existingDoc =
                    currentSnapshot.docs.find(savedDoc => {

                        const savedData = savedDoc.data();

                        return (
                            savedData.userId === auth.currentUser.uid &&
                            savedData.jobId === jobId
                        );

                    });

                if (existingDoc) {

                    await deleteDoc(
                        doc(db, "savedJobs", existingDoc.id)
                    );

                    saveButton.textContent = "Save Job";
                    saveButton.classList.remove("saved");

                } else {

                    const companyName =
                        job.company || "JobNest";

                    const logo =
                        companyName
                            .split(" ")
                            .map(word => word[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase();

                    await addDoc(
                        collection(db, "savedJobs"),
                        {
                            userId: auth.currentUser.uid,
                            jobId: jobId,
                            title: job.title || "",
                            company: job.company || "",
                            location: job.location || "",
                            salary: job.salary || "",
                            logo: logo || "JN",
                            savedAt: new Date().toISOString()
                        }
                    );

                    saveButton.textContent = "Saved";
                    saveButton.classList.add("saved");

                }

            }
        );
    }

}
/* =====================================================
   START JOB DETAILS
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    loadJobDetails
);

/* =====================================================
   APPLICATIONS PAGE
===================================================== */

function loadApplications() {

    const applicationsList =
        document.getElementById("applications-list");

    if (!applicationsList) {
        return;
    }

    const noApplications =
        document.getElementById("no-applications");

    const applicationsCount =
        document.getElementById("applications-count");

    const applications =
        JSON.parse(
            localStorage.getItem("jobnestApplications") || "[]"
        );


    applicationsList.innerHTML = "";


    if (applicationsCount) {
        applicationsCount.textContent =
            `${applications.length} application${applications.length === 1 ? "" : "s"}`;
    }


    if (applications.length === 0) {

        noApplications.style.display = "block";

        return;
    }


    noApplications.style.display = "none";


    applications.forEach(function (application) {

        const card = document.createElement("div");

        card.className = "application-card";

        card.innerHTML = `
            <div class="application-logo">
                ${application.logo || "JN"}
            </div>

            <div class="application-info">

                <h3>
                   ${application.jobTitle || application.title || "Job Position"}
                </h3>

                <p class="application-company">
                    ${application.company}
                </p>

                <div class="application-meta">
                    <span>${application.location}</span>
                    <span>${application.type}</span>
                    <span>${application.salary}</span>
                </div>

            </div>

            <div class="application-status">
                Application Sent
            </div>
        `;

        applicationsList.appendChild(card);

    });

}


/* =====================================================
   START APPLICATIONS
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    loadApplications
);

/* =====================================================
   APPLY NOW
===================================================== */

function setupApplyButton() {

    const applyButton =
        document.getElementById("apply-job-btn");

    if (!applyButton) {
        return;
    }

    applyButton.addEventListener("click", function (event) {

        event.preventDefault();

        const params =
            new URLSearchParams(window.location.search);

        const jobId =
            params.get("id");

        const postedJobs =
            JSON.parse(
                localStorage.getItem("jobnestPostedJobs") || "[]"
            );

        const job =
            postedJobs.find(function (item) {
                return String(item.id) === String(jobId);
            });

        if (!job) {
            window.location.href = "applications.html";
            return;
        }

        let applications =
            JSON.parse(
                localStorage.getItem("jobnestApplications") || "[]"
            );

        const alreadyApplied =
            applications.some(function (application) {
                return String(application.jobId) === String(job.id);
            });

        if (alreadyApplied) {
            window.location.href = "applications.html";
            return;
        }

        const application = {

            id: "application-" + Date.now(),

            jobId: job.id,

            jobTitle:
                job.title || "Job Position",

            company:
                job.company || "Company",

            logo:
                job.logo || "",

            location:
                job.location || "Not specified",

            type:
                job.type || "Not specified",

            mode:
                job.mode || "Not specified",

            category:
                job.category || "Not specified",

            salary:
                job.salary || "Salary not specified",

            status:
                "Applied",

            appliedAt:
                new Date().toISOString()
        };

        applications.unshift(application);

        localStorage.setItem(
            "jobnestApplications",
            JSON.stringify(applications)
        );

        window.location.href =
            "applications.html";

    });

}


/* =====================================================
   START APPLY BUTTON
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    setupApplyButton
);

/* =====================================================
   START APPLY BUTTON
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    setupApplyButton
);

/* =====================================================
   SAVED JOBS PAGE
===================================================== */

async function loadSavedJobsPage() {

    const savedJobsList =
        document.getElementById("saved-jobs-list");

    if (!savedJobsList) {
        return;
    }

    const noSavedJobs =
        document.getElementById("no-saved-jobs");

    const savedJobsCount =
        document.getElementById("saved-jobs-count");

    savedJobsList.innerHTML = "";

    if (!auth.currentUser) {

        if (savedJobsCount) {
            savedJobsCount.textContent = "0 saved jobs";
        }

        if (noSavedJobs) {
            noSavedJobs.style.display = "block";
        }

        return;
    }

    const savedJobsSnapshot =
        await getDocs(collection(db, "savedJobs"));

    const savedJobs =
        savedJobsSnapshot.docs
            .map(savedDoc => ({
                id: savedDoc.id,
                ...savedDoc.data()
            }))
            .filter(job =>
                job.userId === auth.currentUser.uid
            );

    if (savedJobsCount) {
        savedJobsCount.textContent =
            `${savedJobs.length} saved job${savedJobs.length === 1 ? "" : "s"}`;
    }

    if (savedJobs.length === 0) {

        if (noSavedJobs) {
            noSavedJobs.style.display = "block";
        }

        return;
    }

    if (noSavedJobs) {
        noSavedJobs.style.display = "none";
    }

    savedJobs.forEach(function (job) {

        const card =
            document.createElement("div");

        card.className = "saved-job-card";

        card.innerHTML = `
            <div class="saved-job-logo">
                ${job.logo || "JN"}
            </div>

            <div class="saved-job-info">

                <h3>
                    ${job.title || "Untitled Job"}
                </h3>

                <p class="saved-job-company">
                    ${job.company || "JobNest"}
                </p>

                <div class="saved-job-meta">
                    <span>
                        ${job.location || "Not specified"}
                    </span>

                    <span>
                        ${job.salary || "Salary not specified"}
                    </span>
                </div>

            </div>

            <div class="saved-job-actions">

                <a
                    href="job-details.html?id=${job.jobId}"
                    class="saved-job-view"
                >
                    View Job
                </a>

                <button
                    type="button"
                    class="saved-job-remove"
                    data-id="${job.id}"
                >
                    Remove
                </button>

            </div>
        `;

        savedJobsList.appendChild(card);

    });

    document
        .querySelectorAll(".saved-job-remove")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                async function () {

                    const savedJobId =
                        button.dataset.id;

                    const confirmRemove =
                        confirm(
                            "Are you sure you want to remove this saved job?"
                        );

                    if (!confirmRemove) {
                        return;
                    }

                    await deleteDoc(
                        doc(
                            db,
                            "savedJobs",
                            savedJobId
                        )
                    );

                    loadSavedJobsPage();

                }
            );

        });

}


/* =====================================================
   START SAVED JOBS PAGE
===================================================== */

onAuthStateChanged(auth, function () {
    loadSavedJobsPage();
});

/* =====================================================
   PROFILE PAGE
===================================================== */

function loadProfilePage() {

    const profileForm =
        document.getElementById("profile-form");

    if (!profileForm) {
        return;
    }

    const savedProfile =
        JSON.parse(
            localStorage.getItem("jobnestProfile") || "null"
        );


    if (savedProfile) {

        document.getElementById("profile-name").value =
            savedProfile.name || "";

        document.getElementById("profile-email").value =
            savedProfile.email || "";

        document.getElementById("profile-phone").value =
            savedProfile.phone || "";

        document.getElementById("profile-location").value =
            savedProfile.location || "";

        document.getElementById("profile-title").value =
            savedProfile.title || "";

        document.getElementById("profile-experience").value =
            savedProfile.experience || "";

        document.getElementById("profile-skills").value =
            savedProfile.skills || "";

        document.getElementById("profile-bio").value =
            savedProfile.bio || "";

        updateProfileName(savedProfile.name);

    }


    profileForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const profile = {

                name:
                    document.getElementById("profile-name").value.trim(),

                email:
                    document.getElementById("profile-email").value.trim(),

                phone:
                    document.getElementById("profile-phone").value.trim(),

                location:
                    document.getElementById("profile-location").value.trim(),

                title:
                    document.getElementById("profile-title").value.trim(),

                experience:
                    document.getElementById("profile-experience").value,

                skills:
                    document.getElementById("profile-skills").value.trim(),

                bio:
                    document.getElementById("profile-bio").value.trim()

            };


            localStorage.setItem(
                "jobnestProfile",
                JSON.stringify(profile)
            );


            updateProfileName(profile.name);


            const message =
                document.getElementById("profile-message");

            if (message) {

                message.textContent =
                    "Profile saved successfully.";

                setTimeout(function () {
                    message.textContent = "";
                }, 2500);

            }

        }
    );


    updateProfileStats();

}


function updateProfileName(name) {

    const displayName =
        document.getElementById("profile-display-name");

    if (displayName && name) {
        displayName.textContent = name;
    }

}


function updateProfileStats() {

    const savedJobs =
        JSON.parse(
            localStorage.getItem("jobnestSavedJobs") || "[]"
        );

    const applications =
        JSON.parse(
            localStorage.getItem("jobnestApplications") || "[]"
        );


    const savedCount =
        document.getElementById("profile-saved-count");

    const applicationCount =
        document.getElementById("profile-application-count");


    if (savedCount) {
        savedCount.textContent = savedJobs.length;
    }

    if (applicationCount) {
        applicationCount.textContent = applications.length;
    }
    const profileFields = [
        "profile-name",
        "profile-email",
        "profile-phone",
        "profile-location",
        "profile-title",
        "profile-experience",
        "profile-skills",
        "profile-bio"
    ];

    let completedFields = 0;

    profileFields.forEach(function (fieldId) {

        const field = document.getElementById(fieldId);

        if (field && field.value.trim() !== "") {
            completedFields++;
        }

    });

    const completion =
        Math.round(
            (completedFields / profileFields.length) * 100
        );

    const completionPercent =
        document.getElementById("profile-completion-percent");

    const completionFill =
        document.getElementById("profile-completion-fill");

    if (completionPercent) {
        completionPercent.textContent = completion + "%";
    }

    if (completionFill) {
        completionFill.style.width = completion + "%";
    }
}


document.addEventListener(
    "DOMContentLoaded",
    loadProfilePage
);

/* =====================================================
   COMPANIES PAGE SEARCH
===================================================== */

function setupCompaniesPage() {

    const searchInput =
        document.getElementById("company-search");

    const categorySelect =
        document.getElementById("company-category");

    const companies =
        document.querySelectorAll(".company-list-card");

    const noCompanies =
        document.getElementById("no-companies");


    if (!searchInput || !categorySelect) {
        return;
    }


    function filterCompanies() {

        const searchValue =
            searchInput.value
                .trim()
                .toLowerCase();

        const categoryValue =
            categorySelect.value
                .trim()
                .toLowerCase();

        let visibleCount = 0;


        companies.forEach(function (company) {

            const name =
                company.dataset.name.toLowerCase();

            const category =
                company.dataset.category.toLowerCase();


            const matchesSearch =
                !searchValue ||
                name.includes(searchValue);

            const matchesCategory =
                !categoryValue ||
                category === categoryValue;


            if (matchesSearch && matchesCategory) {

                company.style.display = "";

                visibleCount++;

            } else {

                company.style.display = "none";

            }

        });


        if (noCompanies) {

            noCompanies.style.display =
                visibleCount === 0
                    ? "block"
                    : "none";

        }

    }


    searchInput.addEventListener(
        "input",
        filterCompanies
    );

    categorySelect.addEventListener(
        "change",
        filterCompanies
    );

}


document.addEventListener(
    "DOMContentLoaded",
    setupCompaniesPage
);

/* =====================================================
   COMPANY DETAILS DATA
===================================================== */

const companyDetailsData = {

    technova: {
        name: "TechNova Software",
        logo: "TE",
        industry: "Technology",
        location: "Lahore",
        size: "50–100 employees",
        image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80",
        description: "Building modern software products and digital solutions for growing businesses.",
        about: "TechNova Software is a technology company focused on building modern digital products, scalable software solutions, and useful experiences for businesses and their customers.",
        jobs: [
            {
                title: "Frontend Developer",
                location: "Lahore",
                type: "Full-time",
                salary: "PKR 150k – 250k / month",
                id: "frontend-developer"
            },
            {
                title: "Backend Engineer",
                location: "Remote",
                type: "Full-time",
                salary: "PKR 250k – 400k / month",
                id: "backend-engineer"
            }
        ]
    },

    brightedge: {
        name: "BrightEdge Media",
        logo: "BR",
        industry: "Marketing",
        location: "Karachi",
        size: "20–50 employees",
        image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80",
        description: "Helping brands grow through creative campaigns and modern digital marketing.",
        about: "BrightEdge Media is a creative marketing company helping businesses connect with their audiences through digital campaigns, content, branding, and strategic marketing solutions.",
        jobs: [
            {
                title: "Digital Marketing Executive",
                location: "Karachi",
                type: "Full-time",
                salary: "PKR 80k – 120k / month",
                id: "digital-marketing"
            }
        ]
    },

    pixelcraft: {
        name: "PixelCraft Studio",
        logo: "PI",
        industry: "Design",
        location: "Islamabad",
        size: "10–30 employees",
        image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1000&q=80",
        description: "Creating thoughtful interfaces and memorable digital experiences.",
        about: "PixelCraft Studio creates user-focused digital experiences through UI/UX design, visual design, product thinking, and creative digital solutions.",
        jobs: [
            {
                title: "UI/UX Designer",
                location: "Islamabad",
                type: "Full-time",
                salary: "PKR 120k – 200k / month",
                id: "ui-ux-designer"
            }
        ]
    },

    fintrust: {
        name: "FinTrust Bank",
        logo: "FI",
        industry: "Finance",
        location: "Lahore",
        size: "100–500 employees",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
        description: "Providing modern financial services and professional banking solutions.",
        about: "FinTrust Bank provides modern financial services with a focus on reliable banking solutions, financial analysis, customer service, and digital transformation.",
        jobs: [
            {
                title: "Financial Analyst",
                location: "Lahore",
                type: "Full-time",
                salary: "PKR 130k – 190k / month",
                id: "financial-analyst"
            }
        ]
    },

    eduspark: {
        name: "EduSpark",
        logo: "ED",
        industry: "Education",
        location: "Remote",
        size: "20–50 employees",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80",
        description: "Making online learning more accessible, engaging, and effective for students.",
        about: "EduSpark develops online learning experiences designed to make education more accessible and engaging for students and teachers.",
        jobs: [
            {
                title: "Online Math Tutor",
                location: "Remote",
                type: "Part-time",
                salary: "PKR 40k – 70k / month",
                id: "online-math-tutor"
            }
        ]
    }

};


function setupCompanyDetailsPage() {

    const companyName =
        document.getElementById("company-name");

    if (!companyName) {
        return;
    }


    const params =
        new URLSearchParams(window.location.search);

    const companyId =
        params.get("company") || "technova";

    const company =
        companyDetailsData[companyId];


    if (!company) {
        return;
    }


    document.title =
        `${company.name} | JobNest`;


    document.getElementById("company-name").textContent =
        company.name;

    document.getElementById("company-logo").textContent =
        company.logo;

    document.getElementById("company-industry").textContent =
        `${company.industry} · ${company.location}`;

    document.getElementById("company-short-description").textContent =
        company.description;

    document.getElementById("company-about").textContent =
        company.about;

    document.getElementById("company-image").src =
        company.image;

    document.getElementById("company-image").alt =
        company.name;

    document.getElementById("company-industry-side").textContent =
        company.industry;

    document.getElementById("company-location").textContent =
        company.location;

    document.getElementById("company-size").textContent =
        company.size;

    document.getElementById("company-job-count").textContent =
        `${company.jobs.length} position${company.jobs.length > 1 ? "s" : ""}`;


    const jobsContainer =
        document.getElementById("company-jobs");


    jobsContainer.innerHTML = "";


    company.jobs.forEach(function (job) {

        const card =
            document.createElement("div");

        card.className =
            "company-job-card";


        card.innerHTML = `

            <div class="company-job-info">

                <h3>${job.title}</h3>

                <p>
                    ${job.type} · ${job.location}
                </p>

                <p class="company-job-salary">
                    ${job.salary}
                </p>

            </div>

            <a
                href="job-details.html?job=${job.id}"
                class="company-job-link"
            >
                View Job →
            </a>

        `;


        jobsContainer.appendChild(card);

    });

}


document.addEventListener(
    "DOMContentLoaded",
    setupCompanyDetailsPage
);

/* =====================================================
   CAREER RESOURCES SEARCH AND FILTER
===================================================== */

function setupResourcesPage() {
    const searchInput = document.getElementById("resource-search");
    const categorySelect = document.getElementById("resource-category");
    const cards = document.querySelectorAll(".resource-card");
    const emptyMessage = document.getElementById("resources-empty");

    if (!searchInput || !categorySelect) {
        return;
    }

    function filterResources() {
        const keyword = searchInput.value.trim().toLowerCase();
        const category = categorySelect.value.toLowerCase();
        let visibleCount = 0;

        cards.forEach((card) => {
            const title = (card.dataset.title || "").toLowerCase();
            const cardCategory = (card.dataset.category || "").toLowerCase();

            const matchesKeyword = !keyword || title.includes(keyword);
            const matchesCategory = !category || cardCategory === category;
            const shouldShow = matchesKeyword && matchesCategory;

            card.style.display = shouldShow ? "" : "none";

            if (shouldShow) {
                visibleCount++;
            }
        });

        if (emptyMessage) {
            emptyMessage.style.display = visibleCount === 0 ? "block" : "none";
        }
    }

    searchInput.addEventListener("input", filterResources);
    categorySelect.addEventListener("change", filterResources);
}

document.addEventListener("DOMContentLoaded", setupResourcesPage);


/* =====================================================
   RESOURCE DETAILS DATA AND PAGE
===================================================== */

const jobNestResourceData = {

    "cv-guide": {
        category: "CV & RESUME",
        title: "How to Write a Professional CV",
        intro: "Learn how to present your experience, skills, and qualifications clearly to potential employers.",
        image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80",
        sections: [
            {
                heading: "Why your CV matters",
                paragraphs: [
                    "A CV gives employers an overview of your education, experience, skills, and achievements. A clear and relevant CV helps them understand your background.",
                    "Adapt your CV to the role you are applying for, and keep the information accurate and easy to scan."
                ]
            },
            {
                heading: "1. Start with clear contact information",
                paragraphs: [
                    "Include your name, professional email address, phone number, and relevant portfolio or professional profile links. Avoid adding unnecessary personal information."
                ]
            },
            {
                heading: "2. Write a focused professional summary",
                paragraphs: [
                    "Use a few concise sentences to describe your background, strongest relevant skills, and the kind of opportunity you are seeking. Keep it specific to the position."
                ]
            },
            {
                heading: "3. Highlight relevant experience",
                paragraphs: [
                    "List experience in reverse chronological order, starting with the most recent. For each role or project, explain your responsibilities and contributions using clear, factual language."
                ],
                bullets: [
                    "Use short, readable bullet points.",
                    "Describe relevant projects, internships, or volunteer work.",
                    "Include measurable outcomes only when you can verify them."
                ]
            },
            {
                heading: "4. Organize your skills and education",
                paragraphs: [
                    "Include relevant technical and professional skills, followed by your education and any useful certifications. Prioritize the information most relevant to the job."
                ]
            },
            {
                heading: "5. Review before submitting",
                paragraphs: [
                    "Check spelling, dates, formatting, and contact details. Use consistent headings and a simple layout that is easy to read on different devices."
                ],
                bullets: [
                    "Tailor your CV to the job description.",
                    "Use a clear file name, such as Firstname-Lastname-CV.pdf.",
                    "Follow the employer's application instructions."
                ]
            }
        ]
    },

    "interview-guide": {
        category: "INTERVIEW SKILLS",
        title: "Interview Preparation Guide",
        intro: "Prepare for professional conversations by researching the role, practicing your responses, and planning questions.",
        image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
        sections: [
            {
                heading: "Understand the purpose of preparation",
                paragraphs: [
                    "Interview preparation helps you explain your experience and understand whether the role and workplace match your goals. It is also an opportunity to learn more about the employer."
                ]
            },
            {
                heading: "1. Research the organization and role",
                paragraphs: [
                    "Review the employer's official website, the job description, and the responsibilities listed for the position. Identify how your experience and skills relate to the role."
                ]
            },
            {
                heading: "2. Practice common interview questions",
                paragraphs: [
                    "Prepare concise, honest examples about your education, projects, teamwork, problem-solving, and learning experiences. Practice aloud, but avoid memorizing answers word for word."
                ],
                bullets: [
                    "Tell me about yourself.",
                    "What interests you about this role?",
                    "Can you describe a project you worked on?",
                    "What skills would you like to develop?"
                ]
            },
            {
                heading: "3. Structure your examples",
                paragraphs: [
                    "For experience-based questions, you can use the STAR method: Situation, Task, Action, and Result. Explain the context, your responsibility, what you did, and the outcome."
                ]
            },
            {
                heading: "4. Prepare thoughtful questions",
                paragraphs: [
                    "Prepare a few questions about the role, team, expectations, onboarding, and opportunities to learn. This helps you understand the position and its working environment."
                ]
            },
            {
                heading: "5. Plan the practical details",
                paragraphs: [
                    "Confirm the interview time, format, location or meeting link, and any materials requested. For online interviews, check your device and connection in advance."
                ]
            }
        ]
    },

    "career-path": {
        category: "CAREER PLANNING",
        title: "Choosing the Right Career Path",
        intro: "Explore your interests, strengths, and goals to make informed decisions about your professional direction.",
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
        sections: [
            {
                heading: "Start with self-reflection",
                paragraphs: [
                    "Career planning is a process of learning about yourself and exploring different kinds of work. Your interests, values, skills, and priorities can help guide that exploration."
                ]
            },
            {
                heading: "1. Identify your interests",
                paragraphs: [
                    "Think about the subjects, activities, and problems that keep you curious. Consider which tasks you enjoy and the types of environments where you feel engaged."
                ]
            },
            {
                heading: "2. Review your skills",
                paragraphs: [
                    "Make a list of skills you have developed through education, projects, internships, volunteering, or personal activities. Also identify skills you would like to strengthen."
                ]
            },
            {
                heading: "3. Explore different career options",
                paragraphs: [
                    "Research job titles, typical responsibilities, required qualifications, and common work settings. Compare several options rather than relying on a single job title."
                ],
                bullets: [
                    "Read job descriptions from different employers.",
                    "Explore career paths related to your studies.",
                    "Talk with teachers, mentors, or professionals.",
                    "Look for opportunities to learn about a field."
                ]
            },
            {
                heading: "4. Set realistic learning goals",
                paragraphs: [
                    "Choose one or two areas to explore further. You might take a course, build a project, attend a career event, or seek an internship to gain practical insight."
                ]
            },
            {
                heading: "5. Review and adjust your plan",
                paragraphs: [
                    "Career decisions can change as you gain experience. Review your goals periodically and use what you learn to refine your next steps."
                ]
            }
        ]
    },

    "job-search": {
        category: "CAREER PLANNING",
        title: "How to Search for Jobs Effectively",
        intro: "Build an organized job search routine, identify suitable openings, and keep track of your applications.",
        image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80",
        sections: [
            {
                heading: "Create a focused job search",
                paragraphs: [
                    "An organized job search helps you identify relevant opportunities and manage application details. Start by clarifying the types of roles, locations, and work arrangements you are interested in."
                ]
            },
            {
                heading: "1. Define your search criteria",
                paragraphs: [
                    "Choose relevant job titles, industries, locations, and work modes. Keep your criteria flexible enough to discover related roles that may also fit your skills."
                ]
            },
            {
                heading: "2. Use reliable job listings",
                paragraphs: [
                    "Explore employer career pages and reputable job platforms. Read each listing carefully and verify important details on the employer's official channels."
                ]
            },
            {
                heading: "3. Tailor each application",
                paragraphs: [
                    "Review the job requirements and highlight relevant experience, projects, and skills in your CV and application. Follow the employer's requested application process."
                ]
            },
            {
                heading: "4. Track your applications",
                paragraphs: [
                    "Maintain a simple record of the role, company, application date, contact details, and any follow-up steps. This helps you stay organized and avoid duplicate applications."
                ]
            },
            {
                heading: "5. Keep improving your approach",
                paragraphs: [
                    "Review the roles you find and the responses you receive. Use that information to refine your search criteria, strengthen your application materials, and identify skills to develop."
                ]
            }
        ]
    },

    "career-skills": {
        category: "CAREER PLANNING",
        title: "Building Skills for Your Career",
        intro: "Discover practical ways to develop relevant skills and continue learning as workplace needs evolve.",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
        sections: [
            {
                heading: "Build skills with a learning plan",
                paragraphs: [
                    "Professional skills develop over time through learning, practice, and feedback. A simple plan can help you focus on abilities relevant to your interests and career goals."
                ]
            },
            {
                heading: "1. Identify useful skills",
                paragraphs: [
                    "Review job descriptions in your field and note recurring technical, communication, collaboration, and problem-solving requirements."
                ]
            },
            {
                heading: "2. Choose a learning activity",
                paragraphs: [
                    "Select a course, tutorial, book, workshop, or practical project that helps you build one specific skill. Choose learning materials appropriate to your current level."
                ]
            },
            {
                heading: "3. Practice through projects",
                paragraphs: [
                    "Apply what you learn in a small project, assignment, or supervised activity. Practical work can help you understand concepts and demonstrate your progress."
                ]
            },
            {
                heading: "4. Ask for feedback",
                paragraphs: [
                    "Share your work with a teacher, mentor, or trusted peer. Specific feedback can help you identify what is working and what to improve."
                ]
            },
            {
                heading: "5. Record your progress",
                paragraphs: [
                    "Keep a record of completed courses, projects, and skills practiced. Update your CV or portfolio when you have relevant work to show."
                ]
            }
        ]
    },

    "first-job": {
        category: "CAREER PLANNING",
        title: "Getting Ready for Your First Job",
        intro: "Understand workplace expectations and prepare for a positive transition into your first professional role.",
        image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
        sections: [
            {
                heading: "Prepare for the transition",
                paragraphs: [
                    "Starting a first job is an opportunity to apply your knowledge, learn from others, and become familiar with a professional environment. Asking questions and staying organized can help you adjust."
                ]
            },
            {
                heading: "1. Understand your role",
                paragraphs: [
                    "Review your job responsibilities, expected working hours, reporting arrangements, and initial goals. Ask your manager for clarification when something is unclear."
                ]
            },
            {
                heading: "2. Practice professional communication",
                paragraphs: [
                    "Communicate respectfully and clearly with colleagues. Share progress, ask questions when needed, and let the appropriate person know if you encounter a difficulty."
                ]
            },
            {
                heading: "3. Organize your work",
                paragraphs: [
                    "Keep track of tasks, deadlines, meetings, and instructions. Use the team's preferred tools and clarify priorities when several tasks need attention."
                ]
            },
            {
                heading: "4. Learn from feedback",
                paragraphs: [
                    "Treat feedback as information that can support your development. Ask for examples or clarification when useful, and apply what you learn to future tasks."
                ]
            },
            {
                heading: "5. Continue developing",
                paragraphs: [
                    "Identify areas where you want to grow and look for suitable learning opportunities. Building good work habits and seeking guidance can support your professional progress."
                ]
            }
        ]
    }

};


function setupResourceDetailsPage() {
    const titleElement = document.getElementById("resource-title");

    if (!titleElement) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const resourceId = params.get("resource") || "cv-guide";
    const resource = jobNestResourceData[resourceId];

    if (!resource) {
        titleElement.textContent = "Guide not found";

        const intro = document.getElementById("resource-intro");
        if (intro) {
            intro.textContent = "This guide could not be found. Please return to Career Resources and select another guide.";
        }

        const article = document.getElementById("resource-article-content");
        if (article) {
            article.innerHTML = '<p>Please visit the <a href="resources.html">Career Resources page</a> to choose an available guide.</p>';
        }

        const image = document.getElementById("resource-image");
        if (image) {
            image.style.display = "none";
        }

        return;
    }

    document.title = `${resource.title} | JobNest`;

    document.getElementById("resource-category-label").textContent = resource.category;
    document.getElementById("resource-title").textContent = resource.title;
    document.getElementById("resource-intro").textContent = resource.intro;

    const image = document.getElementById("resource-image");
    image.src = resource.image;
    image.alt = resource.title;

    const article = document.getElementById("resource-article-content");
    const toc = document.getElementById("resource-toc");

    article.innerHTML = "";
    toc.innerHTML = "";

    resource.sections.forEach((section, index) => {
        const headingId = `guide-section-${index + 1}`;

        const tocItem = document.createElement("li");
        const tocLink = document.createElement("a");
        tocLink.href = `#${headingId}`;
        tocLink.textContent = section.heading;
        tocLink.style.color = "inherit";
        tocLink.style.textDecoration = "none";
        tocItem.appendChild(tocLink);
        toc.appendChild(tocItem);

        const heading = document.createElement("h2");
        heading.id = headingId;
        heading.textContent = section.heading;
        article.appendChild(heading);

        (section.paragraphs || []).forEach((paragraphText) => {
            const paragraph = document.createElement("p");
            paragraph.textContent = paragraphText;
            article.appendChild(paragraph);
        });

        if (section.bullets && section.bullets.length) {
            const list = document.createElement("ul");

            section.bullets.forEach((bulletText) => {
                const item = document.createElement("li");
                item.textContent = bulletText;
                list.appendChild(item);
            });

            article.appendChild(list);
        }
    });
}

document.addEventListener("DOMContentLoaded", setupResourceDetailsPage);


/* =====================================================
   JOBNEST LOGIN FORM VALIDATION
===================================================== */

function setupJobNestLoginForm() {

    const loginForm = document.getElementById("login-form");

    if (!loginForm) return;

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email =
            document.getElementById("login-email").value.trim();

        const password =
            document.getElementById("login-password").value;

        const message =
            document.getElementById("login-message");


        if (!email || !password) {

            message.textContent =
                "Please enter your email and password.";

            return;
        }

        message.textContent =
            "Form validated.";

    });
}



document.addEventListener("DOMContentLoaded", function () {

    const postJobForm =
        document.getElementById("post-job-form");

    if (!postJobForm) return;


    const message =
        document.getElementById("post-job-message");


    onAuthStateChanged(auth, async function (user) {

        if (!user) {
            message.textContent =
                "Please sign in before posting a job.";

            message.className =
                "post-job-message error";

            return;
        }


        postJobForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                if (!postJobForm.reportValidity()) {
                    return;
                }


                const formData =
                    new FormData(postJobForm);


                const newJob = {

                    title:
                        String(
                            formData.get("title") || ""
                        ).trim(),

                    company:
                        String(
                            formData.get("company") || ""
                        ).trim(),

                    category:
                        String(
                            formData.get("category") || ""
                        ).trim(),

                    location:
                        String(
                            formData.get("location") || ""
                        ).trim(),

                    type:
                        String(
                            formData.get("type") || ""
                        ).trim(),

                    mode:
                        String(
                            formData.get("mode") || ""
                        ).trim(),

                    salary:
                        String(
                            formData.get("salary") || ""
                        ).trim(),

                    description:
                        String(
                            formData.get("description") || ""
                        ).trim(),

                    responsibilities:
                        String(
                            formData.get("responsibilities") || ""
                        ).trim(),

                    requirements:
                        String(
                            formData.get("requirements") || ""
                        ).trim(),

                    email:
                        String(
                            formData.get("email") || ""
                        ).trim(),

                    employerId:
                        user.uid,

                    employerEmail:
                        user.email || "",

                    postedAt:
                        new Date().toISOString(),

                    status:
                        "Active"
                };


                try {

                    const editData =
                        JSON.parse(
                            localStorage.getItem(
                                "jobnestEditJob"
                            ) || "null"
                        );


                    if (
                        editData &&
                        editData.job &&
                        editData.job.id
                    ) {

                        const jobRef =
                            doc(
                                db,
                                "jobs",
                                editData.job.id
                            );


                        const existingJob =
                            await getDoc(jobRef);


                        if (
                            existingJob.exists() &&
                            existingJob.data().employerId === user.uid
                        ) {

                            await updateDoc(
                                jobRef,
                                newJob
                            );

                        } else {

                            throw new Error(
                                "Job not found or unauthorized."
                            );

                        }


                        localStorage.removeItem(
                            "jobnestEditJob"
                        );


                    } else {

                        await addDoc(
                            collection(db, "jobs"),
                            newJob
                        );

                    }


                    message.textContent =
                        "Job listing saved successfully!";

                    message.className =
                        "post-job-message success";


                    postJobForm.reset();


                    message.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest"
                    });


                } catch (error) {

                    console.error(
                        "Error saving job:",
                        error
                    );


                    message.textContent =
                        "Unable to save the job listing. Please try again.";

                    message.className =
                        "post-job-message error";

                }

            }
        );

    });

});
/* =====================================
   JOBNEST APPLICATIONS PAGE
===================================== */

document.addEventListener("DOMContentLoaded", function () {

  const applicationsList = document.getElementById("applications-list");

  if (!applicationsList) return;

  const emptyState = document.getElementById("applications-empty");

  const totalCount = document.getElementById("total-applications");
  const pendingCount = document.getElementById("pending-applications");
  const reviewCount = document.getElementById("review-applications");
  const interviewCount = document.getElementById("interview-applications");

  let applications = [];

  try {
    applications = JSON.parse(
      localStorage.getItem("jobnestApplications") || "[]"
    );

    if (!Array.isArray(applications)) {
      applications = [];
    }
  } catch (error) {
    applications = [];
  }

  totalCount.textContent = applications.length;

  const pending = applications.filter(function (app) {
    return !app.status ||
      String(app.status).toLowerCase() === "pending";
  }).length;

  const review = applications.filter(function (app) {
    return String(app.status).toLowerCase().includes("review");
  }).length;

  const interview = applications.filter(function (app) {
    return String(app.status).toLowerCase().includes("interview");
  }).length;

  pendingCount.textContent = pending;
  reviewCount.textContent = review;
  interviewCount.textContent = interview;


  if (applications.length === 0) {

    applicationsList.innerHTML = "";
    emptyState.classList.add("show");

    return;
  }

  emptyState.classList.remove("show");


  applicationsList.innerHTML = applications.map(function (app) {

    const title = app.title || app.jobTitle || "Job Application";
    const company = app.company || "Company";
    const location = app.location || "Location not specified";
    const type = app.type || "Full-time";

    const rawStatus = app.status || "Pending";

    let statusClass = "";

    if (String(rawStatus).toLowerCase().includes("review")) {
      statusClass = "review";
    }

    if (String(rawStatus).toLowerCase().includes("interview")) {
      statusClass = "interview";
    }

    if (String(rawStatus).toLowerCase().includes("reject")) {
      statusClass = "rejected";
    }

    const jobId =
      app.id ||
      app.jobId ||
      title.toLowerCase().replace(/\s+/g, "-");

    return `
      <article class="application-card">

        <div class="application-main">

          <h3 class="application-title">
            ${title}
          </h3>

          <p class="application-company">
            ${company}
          </p>

          <div class="application-meta">
            <span>${location}</span>
            <span>${type}</span>
          </div>

        </div>

        <div class="application-side">

          <span class="application-status ${statusClass}">
            ${rawStatus}
          </span>

          <a
            href="job-details.html?job=${encodeURIComponent(jobId)}"
            class="application-view-btn"
          >
            View Job →
          </a>

        </div>

      </article>
    `;

  }).join("");

});

/* =========================================
   JOBNEST APPLICATION TRACKING SYSTEM
========================================= */

function setupApplicationTracker() {
    const tracker = document.getElementById("application-tracker");

    if (!tracker) return;

    const applications =
        JSON.parse(localStorage.getItem("jobnestApplications")) || [];

    if (applications.length === 0) {
        tracker.innerHTML = `
            <div class="tracker-card">
                <h3>No applications yet</h3>
                <p>
                    Apply for a job to start tracking your application journey.
                </p>
            </div>
        `;
        return;
    }

   const stages = [
    "Applied",
    "Under Review",
    "Shortlisted",
    "Interview",
    "Selected",
    "Rejected"
];

    tracker.innerHTML = applications.map((application, index) => {

        const currentStage = application.status || "Applied";

        let currentIndex = stages.indexOf(currentStage);

        if (currentIndex === -1) {
            currentIndex = 0;
        }

    const progressStages = [
    "Applied",
    "Under Review",
    "Shortlisted",
    "Interview",
    "Selected",
    "Rejected"
];

        const steps = progressStages.map((stage, stageIndex) => `
            <div class="tracker-step ${
                stageIndex <= progressStages.indexOf(currentStage)
                    ? "completed"
                    : ""
            }">
                <span>${stageIndex + 1}</span>
                ${stage}
            </div>
        `).join("");

        return `
            <div class="tracker-card">

                <h3>
                    ${application.title || "Job Application"}
                </h3>

                <p>
                    ${application.company || "Company"}
                    ${application.location ? " • " + application.location : ""}
                </p>

                <span class="tracker-status ${
                    currentStage === "Rejected"
                        ? "tracker-rejected"
                        : ""
                }">
                    Current Status: ${currentStage}
                </span>

                <div class="tracker-progress">
                    ${steps}
                </div>

                <div class="tracker-update">

                    <label for="status-${index}">
                        Update Application Status
                    </label>

                    <select
                        id="status-${index}"
                        onchange="updateApplicationStatus(${index}, this.value)"
                    >

                        ${stages.map(stage => `
                            <option
                                value="${stage}"
                                ${stage === currentStage ? "selected" : ""}
                            >
                                ${stage}
                            </option>
                        `).join("")}

                    </select>

                </div>

            </div>
        `;

    }).join("");
}


/* =========================================
   UPDATE APPLICATION STATUS
========================================= */

function updateApplicationStatus(index, newStatus) {

    const applications =
        JSON.parse(localStorage.getItem("jobnestApplications")) || [];

    if (!applications[index]) return;

    applications[index].status = newStatus;

    localStorage.setItem(
        "jobnestApplications",
        JSON.stringify(applications)
    );

    setupApplicationTracker();

    updateApplicationStats();

    if (typeof setupApplicationsPage === "function") {
        setupApplicationsPage();
    }
}


/* =========================================
   APPLICATION STATISTICS
========================================= */

function updateApplicationStats() {

    const applications =
        JSON.parse(localStorage.getItem("jobnestApplications")) || [];

    const total = applications.length;

    const pending = applications.filter(application =>
        !application.status ||
        application.status === "Applied"
    ).length;

    const review = applications.filter(application =>
        application.status === "Under Review"
    ).length;

    const interviews = applications.filter(application =>
        application.status === "Interview"
    ).length;


    const totalElement =
        document.getElementById("total-applications");

    const pendingElement =
        document.getElementById("pending-applications");

    const reviewElement =
        document.getElementById("review-applications");

    const interviewElement =
        document.getElementById("interview-applications");


    if (totalElement) {
        totalElement.textContent = total;
    }

    if (pendingElement) {
        pendingElement.textContent = pending;
    }

    if (reviewElement) {
        reviewElement.textContent = review;
    }

    if (interviewElement) {
        interviewElement.textContent = interviews;
    }
}


/* =========================================
   APPLICATION TRACKING INITIALIZATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupApplicationTracker();

        updateApplicationStats();

    }
);

/* =========================================
   JOBNEST EMPLOYER DASHBOARD
========================================= */

function setupEmployerDashboard() {

    const jobsList = document.getElementById("employer-jobs-list");

    if (!jobsList) return;

    const postedJobs =
        JSON.parse(localStorage.getItem("jobnestPostedJobs")) || [];

    const applications =
        JSON.parse(localStorage.getItem("jobnestApplications")) || [];


    /* =========================
       STATISTICS
    ========================== */

    const totalJobs = postedJobs.length;

    const activeJobs = postedJobs.filter(job =>
        job.status !== "Closed"
    ).length;

    const totalApplications = applications.length;

    const shortlisted = applications.filter(application =>
        application.status === "Shortlisted"
    ).length;


    const totalJobsElement =
        document.getElementById("employer-total-jobs");

    const activeJobsElement =
        document.getElementById("employer-active-jobs");

    const applicationsElement =
        document.getElementById("employer-total-applications");

    const shortlistedElement =
        document.getElementById("employer-shortlisted");


    if (totalJobsElement)
        totalJobsElement.textContent = totalJobs;

    if (activeJobsElement)
        activeJobsElement.textContent = activeJobs;

    if (applicationsElement)
        applicationsElement.textContent = totalApplications;

    if (shortlistedElement)
        shortlistedElement.textContent = shortlisted;


    /* =========================
   POSTED JOBS
========================= */

if (postedJobs.length === 0) {

    jobsList.innerHTML = `
        <div class="dashboard-empty-state">

            <div class="empty-icon">
                💼
            </div>

            <h3>
                No jobs posted yet
            </h3>

            <p>
                Start hiring by posting your first job opportunity.
            </p>

            <a href="post-job.html" class="btn btn-primary">
                Post Your First Job
            </a>

        </div>
    `;

} else {

    jobsList.innerHTML = postedJobs
        .map(function (job, index) {

            return `
                <div class="dashboard-job-card">

                    <div>

                        <span class="job-status">
                            ${job.status || "Active"}
                        </span>

                        <h3>
                            ${job.title || "Job Position"}
                        </h3>

                        <p>
                            ${job.company || "Company"}
                            ${job.location ? " • " + job.location : ""}
                        </p>

                    </div>

                    <div class="dashboard-job-actions">

                        <a 
    href="job-details.html?id=${job.id}" 
    class="btn btn-outline" 
>
    View 
</a>

                        <button
                            class="btn btn-primary"
                            onclick="editEmployerJob(${index})"
                        >
                            Edit Job
                        </button>

                        <button
                            class="btn btn-danger"
                            onclick="closeEmployerJob(${index})"
                        >
                            Close Job
                        </button>

                        <button
                            class="btn btn-danger"
                            onclick="deleteEmployerJob(${index})"
                        >
                            Delete Job
                        </button>

                    </div>

                </div>
            `;

        })
        .join("");

}
}

/* =========================
   APPLICATIONS
========================= */

const applicationsList =
    document.getElementById("employer-applications-list");

if (applicationsList) {

    if (applications.length === 0) {

        applicationsList.innerHTML = `
            <div class="dashboard-empty-state">
                <div class="empty-icon">📩</div>

                <h3>No applications yet</h3>

                <p>
                    Applications from candidates will appear here.
                </p>
            </div>
        `;

    } else {

        applicationsList.innerHTML = applications
            .slice(0, 5)
            .map(function (application) {

                return `
                    <div class="dashboard-application-card">

                        <div>
                            <h3>
                                ${application.name || "Candidate"}
                            </h3>

                            <p>
                                Applied for:
                                ${application.title || "Job Position"}
                            </p>
                        </div>
<div>
    <span class="tracker-status">
        ${application.status || "Applied"}
    </span>

    <select
        class="application-status-select"
        onchange="updateEmployerApplicationStatus(this, '${application.id || ""}')"
    >
        <option value="Applied" ${
            (application.status || "Applied") === "Applied"
                ? "selected"
                : ""
        }>
            Applied
        </option>

        <option value="Under Review" ${
            application.status === "Under Review"
                ? "selected"
                : ""
        }>
            Under Review
        </option>

        <option value="Shortlisted" ${
            application.status === "Shortlisted"
                ? "selected"
                : ""
        }>
            Shortlisted
        </option>

        <option value="Interview" ${
            application.status === "Interview"
                ? "selected"
                : ""
        }>
            Interview
        </option>

        <option value="Selected" ${
            application.status === "Selected"
                ? "selected"
                : ""
        }>
            Selected
        </option>

        <option value="Rejected" ${
            application.status === "Rejected"
                ? "selected"
                : ""
        }>
            Rejected
        </option>
    </select>
</div>

                    </div>
                `;

            })
            .join("");
    }
}


/* =========================
   CLOSE JOB
========================= */

function closeEmployerJob(index) {

    const postedJobs =
        JSON.parse(localStorage.getItem("jobnestPostedJobs")) || [];

    if (!postedJobs[index]) return;

    const confirmClose = confirm(
        "Are you sure you want to close this job?"
    );

    if (!confirmClose) return;

    postedJobs[index].status = "Closed";

    localStorage.setItem(
        "jobnestPostedJobs",
        JSON.stringify(postedJobs)
    );

    setupEmployerDashboard();
}


/* =========================
   EDIT EMPLOYER JOB
========================= */

function editEmployerJob(index) {

    const postedJobs =
        JSON.parse(localStorage.getItem("jobnestPostedJobs")) || [];

    if (!postedJobs[index]) return;

    localStorage.setItem(
        "jobnestEditJob",
        JSON.stringify({
            index: index,
            job: postedJobs[index]
        })
    );

    window.location.href = "post-job.html";
}


/* =====================================
   JOBNEST EDIT JOB - LOAD EXISTING DATA
===================================== */

document.addEventListener("DOMContentLoaded", function () {

    const postJobForm =
        document.getElementById("post-job-form");

    if (!postJobForm) return;

    const editData =
        JSON.parse(
            localStorage.getItem("jobnestEditJob") || "null"
        );

    if (!editData || !editData.job) return;

    const job = editData.job;

    const fields = [
        "title",
        "company",
        "category",
        "location",
        "type",
        "mode",
        "salary",
        "description",
        "responsibilities",
        "requirements",
        "email"
    ];

    fields.forEach(function (field) {

        const input =
            postJobForm.querySelector(`[name="${field}"]`);

        if (input) {
            input.value = job[field] || "";
        }

    });

});


/* =========================
   DELETE JOB
========================= */

function deleteEmployerJob(index) {

    const postedJobs =
        JSON.parse(localStorage.getItem("jobnestPostedJobs")) || [];

    if (!postedJobs[index]) return;

    const confirmDelete = confirm(
        "Are you sure you want to permanently delete this job?"
    );

    if (!confirmDelete) return;

    postedJobs.splice(index, 1);

    localStorage.setItem(
        "jobnestPostedJobs",
        JSON.stringify(postedJobs)
    );

    setupEmployerDashboard();
}

/* =========================
   UPDATE EMPLOYER APPLICATION STATUS
========================= */

function updateEmployerApplicationStatus(selectElement, applicationId) {

    const applications =
        JSON.parse(localStorage.getItem("jobnestApplications")) || [];

    const applicationIndex = applications.findIndex(
        application => String(application.id || "") === String(applicationId)
    );

    if (applicationIndex === -1) return;

    applications[applicationIndex].status = selectElement.value;

    localStorage.setItem(
        "jobnestApplications",
        JSON.stringify(applications)
    );

    setupEmployerDashboard();
}
/* =========================
   INITIALIZE DASHBOARD
========================= */

document.addEventListener("DOMContentLoaded", function () {

    setupEmployerDashboard();

});



document.addEventListener("DOMContentLoaded", async function () {

    const jobTitle =
        document.getElementById("detail-job-title");

    if (!jobTitle) return;


    const params =
        new URLSearchParams(window.location.search);

    const jobId =
        params.get("id") || params.get("job");

    if (!jobId) return;


    try {

        const jobRef =
            doc(db, "jobs", jobId);

        const jobSnapshot =
            await getDoc(jobRef);


        if (!jobSnapshot.exists()) {

            jobTitle.textContent =
                "Job Not Found";

            return;
        }


        const job =
            jobSnapshot.data();


        /* JOB HEADER */

        jobTitle.textContent =
            job.title || "Job Position";


        document.getElementById(
            "detail-company"
        ).textContent =
            job.company || "Company";


        /* JOB INFORMATION */

        document.getElementById(
            "detail-job-type"
        ).textContent =
            job.type || "Not specified";


        document.getElementById(
            "detail-location"
        ).textContent =
            job.location || "Not specified";


        document.getElementById(
            "detail-work-mode"
        ).textContent =
            job.mode || "Not specified";


        document.getElementById(
            "detail-category"
        ).textContent =
            job.category || "Not specified";


        document.getElementById(
            "detail-salary"
        ).textContent =
            job.salary || "Not specified";


        /* DESCRIPTION */

        const description =
            document.getElementById(
                "detail-description"
            );


        if (description) {

            description.textContent =
                job.description ||
                "No description provided.";

        }


        /* RESPONSIBILITIES */

        const responsibilitySection =
            document.querySelectorAll(
                ".job-content-section"
            )[1];


        if (
            responsibilitySection &&
            job.responsibilities
        ) {

            const list =
                responsibilitySection.querySelector(
                    ".job-detail-list"
                );


            if (list) {

                list.innerHTML =
                    job.responsibilities
                        .split(/\r?\n/)
                        .filter(
                            item => item.trim()
                        )
                        .map(
                            item =>
                                `<li>${item.trim()}</li>`
                        )
                        .join("");

            }

        }


        /* REQUIREMENTS */

        const requirementSection =
            document.querySelectorAll(
                ".job-content-section"
            )[2];


        if (
            requirementSection &&
            job.requirements
        ) {

            const list =
                requirementSection.querySelector(
                    ".job-detail-list"
                );


            if (list) {

                list.innerHTML =
                    job.requirements
                        .split(/\r?\n/)
                        .filter(
                            item => item.trim()
                        )
                        .map(
                            item =>
                                `<li>${item.trim()}</li>`
                        )
                        .join("");

            }

        }


        /* COMPANY */

        const sidebarCompanyName =
            document.getElementById(
                "sidebar-company-name"
            );


        if (sidebarCompanyName) {

            sidebarCompanyName.textContent =
                job.company || "Company";

        }


        const sidebarCompanyDescription =
            document.getElementById(
                "sidebar-company-description"
            );


        if (sidebarCompanyDescription) {

            sidebarCompanyDescription.textContent =
                "Company information will be available soon.";

        }


        /* COMPANY LOGO */

        const companyName =
            job.company || "Company";


        const initials =
            companyName
                .split(" ")
                .map(
                    word =>
                        word.charAt(0)
                )
                .join("")
                .substring(0, 2)
                .toUpperCase();


        const companyLogo =
            document.getElementById(
                "detail-company-logo"
            );


        const sidebarLogo =
            document.getElementById(
                "sidebar-company-logo"
            );


        if (companyLogo) {

            companyLogo.textContent =
                initials;

        }


        if (sidebarLogo) {

            sidebarLogo.textContent =
                initials;

        }


    } catch (error) {

        console.error(
            "Error loading job:",
            error
        );


        jobTitle.textContent =
            "Unable to load job details.";

    }

});

/* =====================================
   JOBNEST HOME SEARCH
===================================== */

document.addEventListener("DOMContentLoaded", function () {

    const heroSearchForm =
        document.getElementById("hero-search-form");

    if (!heroSearchForm) return;

    heroSearchForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const keyword =
            document.getElementById("hero-keyword").value.trim();

        const location =
            document.getElementById("hero-location").value;

        const params = new URLSearchParams();

        if (keyword) {
            params.set("keyword", keyword);
        }

        if (location) {
            params.set("location", location);
        }

        window.location.href =
            "jobs.html" +
            (params.toString() ? "?" + params.toString() : "");

    });

});

/* =====================================
   JOBNEST HOME - DYNAMIC POSTED JOBS
===================================== */

document.addEventListener("DOMContentLoaded", function () {

    const homeJobsGrid =
        document.getElementById("home-jobs-grid");

    if (!homeJobsGrid) return;

    const postedJobs =
        JSON.parse(
            localStorage.getItem("jobnestPostedJobs") || "[]"
        );

    if (!Array.isArray(postedJobs) || postedJobs.length === 0) {
        return;
    }

    const dynamicJobs = postedJobs.map(function (job) {

        const companyName =
            job.company || "Company";

        const initials =
            companyName
                .split(" ")
                .map(function (word) {
                    return word.charAt(0);
                })
                .join("")
                .substring(0, 2)
                .toUpperCase();

        return `
            <article class="job-card">

                <div class="job-image">
                    <div class="job-company-logo">
                        ${initials}
                    </div>
                </div>

                <div class="job-card-content">

                    <span class="job-company-logo">
                        ${initials}
                    </span>

                    <div class="job-info">

                        <h3>
                            ${job.title || "Job Position"}
                        </h3>

                        <p>
                            ${companyName}
                        </p>

                        <div class="job-meta">

                            <span>
                                ${job.type || "Full-time"}
                            </span>

                            <span>
                                ${job.location || "Not specified"}
                            </span>

                            <span>
                                ${job.category || "General"}
                            </span>

                        </div>

                        <strong>
                            ${job.salary || "Salary not specified"}
                        </strong>

                    </div>

                </div>

                <a
                    href="job-details.html?id=${job.id}"
                    class="job-link"
                >
                    View Job →
                </a>

            </article>
        `;
    }).join("");

    homeJobsGrid.insertAdjacentHTML(
        "afterbegin",
        dynamicJobs
    );

});

document.addEventListener("DOMContentLoaded", function () {
    setupApplyButton();
});
