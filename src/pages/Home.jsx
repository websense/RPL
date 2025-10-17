import { Link } from "react-router-dom";
import winthrop from "../assets/winthrophall.jpg";

export default function Home() {
  const isLoggedIn = Boolean(localStorage.getItem("username") || sessionStorage.getItem("username"));
  return (
    <div className="w-screen pt-20">
      <div className="relative w-screen h-100 bg-red-600">
        <img src={winthrop} alt="Winthrop Hall" className="w-full h-full object-cover object-bottom"/>
        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 w-11/12 sm:w-2/3 md:w-1/2 h-auto min-h-32 bg-white bg-opacity-90 border-3 border-primary rounded-md shadow-md flex flex-col items-start z-10 text-left p-2">
          <span className="text-2xl md:text-5xl font-bold text-primary break-words">Seeking Recognition for Prior Learning?</span>
          <span className="text-base md:text-xl text-text mt-4 break-words">If you've completed prior learning that you'd like to gain credit for, please click below.</span>
          <Link to="/application">
            <button className="mt-3 text-primary font-bold text-base md:text-lg px-4 md:px-8 py-2 md:py-3">
              Apply
            </button>
          </Link>
        </div>
      </div>

      <div className="w-full mx-auto my-16 px-5 pt-25">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-2">
          <div className="pr-0 md:pr-8 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold text-text mb-4 text-center">Applicants</h2>
            <p className="text-text leading-relaxed text-center">If you are currently enrolled in a course at UWA, you can apply for credit for units passed in a previous course from an external university or institution.</p>
          </div>
          <div className="border-t-3 border-primary md:border-t-0 md:border-l-3 md:pl-8 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold text-text mb-4 text-center pt-4">Staff</h2>
            <p className="text-text leading-relaxed text-center">If you are a staff member at UWA, login here to view your application portal.</p>
            {!isLoggedIn && (
              <Link to="/staff-login">
                <button className="mt-4 text-primary px-8 py-3 font-bold text-lg">Admin Portal Login</button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

