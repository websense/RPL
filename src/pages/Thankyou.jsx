import { Link } from "react-router-dom";

// Need to show application number from database
export default function Thankyou() {
  return (
	<div className="flex items-center justify-center min-h-screen">
	  <div className="flex flex-col items-center justify-center text-center">
	  	<p className="text-[50px] font-bold">Thank You!</p>
		<p className="pt-5">Your form was successfully submitted.</p>
		<p className="pt-5 pb-10">Please  retain the saved copy of your form in case modifications are required.</p>
		<Link to="/">
			<button type="button" name="home" id="home">Back to Homepage</button>
		</Link>
	  </div>
	</div>
  );
}