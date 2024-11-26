// svg
import logo from "../assets/svg/logo.svg";
import { useEffect, useState, useContext, useCallback, useRef } from "react";
import TagsContext from "../context/TagsContext";
import { useNavigate, useLocation } from "react-router-dom";
import removeIcon from "../assets/svg/remove.svg";
//NEW IMPORTS\\
import { ReactComponent as LupeIcon } from "../assets/svg/lupe.svg";
import { ReactComponent as XIcon } from "../assets/svg/x.svg";
import { ReactComponent as MapPinIcon } from "../assets/svg/map_pin.svg";
import { orase } from "../utils/getCityName";
// components
import FiltreGrup from "./FiltreGrup";
// redux
import { useSelector, useDispatch } from "react-redux";
// functions to update the jobSlice state.
import {
  setJobs,
  clearJobs,
  setTotal,
  setNumberOfCompany,
  setLoading
} from "../reducers/jobsSlice";
// utils fetch functions
import { createSearchString } from "../utils/createSearchString";
// functions to fetch the data
import {
  getData,
  getNumberOfCompany,
  getJobSuggestion
} from "../utils/fetchData";
import { findParamInURL, updateUrlParams } from "../utils/urlManipulation";
import Button from "./Button";

const FilterTags = ({ tags, removeTag }) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {Object.entries(tags).map(([key, currentArray]) =>
        currentArray.map((item) => (
          <Button
            key={item}
            buttonType="addFilters"
            onClick={() => removeTag(key, item)}
          >
            {item}
            <img src={removeIcon} alt="x" className="cursor-pointer ml-2" />
          </Button>
        ))
      )}
    </div>
  );
};

const Search = (props) => {
  const {
    q,
    city,
    remote,
    county,
    company,
    removeTag,
    deletAll,
    handleRemoveAllFilters,
    contextSetQ,
    contextSetCity,
    fields
  } = useContext(TagsContext);
  // fields
  const [text, setText] = useState("");
  // dispatch
  const navigate = useNavigate(); // Get the navigate function
  const location = useLocation(); // Get the current location
  const dispatch = useDispatch();

  // jobs
  const total = useSelector((state) => state.jobs.total);
  const loading = useSelector((state) => state.jobs.loading);
  const nrJoburi =
    total >= 20 ? "de rezultate" : total === 1 ? "rezultat" : "rezultate";

  //new\\
  const [locationn, setLocation] = useState("");
  /* const [locationTest, setLocationSuggestions] = useState([]); */
  const [focusedInput, setFocusedInput] = useState(null);
  const handleClearLocation = () => setLocation("");
  const handleFocus = (input) => setFocusedInput(input);
  // const handleBlur = () => setFocusedInput(null); // Optional, depending on whether you want to hide the dropdown when blurred
  const [filteredCities, setFilteredCities] = useState(orase); // State for filtered cities
  const dropdownRef = useRef(null);

  // state for job suggestion drop-down
  const [jobSuggestions, setJobSuggestions] = useState([]);
  // useEffect to set the search input field as the user search query

  useEffect(() => {
    if (location.pathname === "/rezultate") {
      setText(q + "");
    }
  }, [location.pathname, q]);

  useEffect(() => {
    if (!location.pathname.includes("/rezultate")) {
      return;
    }
    //Keeping the state in sync with the URL param
    const qParam = findParamInURL("q");
    const cityParam = findParamInURL("city");
    contextSetQ(qParam || [""]);
    contextSetCity(cityParam || [""]);
  }, [contextSetQ, contextSetCity, location.pathname, location.search]);
  // useEffect to load the number of company and jobs
  useEffect(() => {
    const numbersInfo = async () => {
      const companyNumber = await getNumberOfCompany();
      dispatch(setNumberOfCompany(companyNumber));
    };
    numbersInfo();
  }, [dispatch]);
  // Send text from input into state q.
  const handleUpdateQ = async (e) => {
    e.preventDefault();

    if (location.pathname !== "/rezultate") {
      navigate("/rezultate"); // Use navigate to redirect to "/rezult"
    }
    contextSetQ([text]);
    contextSetCity([locationn]);
  };

  // fetch data when states change values
  // this make the fetch automated when checkboxes are checked or unchecked
  useEffect(() => {
    // Function to fetch data and update state
    const fetchData = async () => {
      try {
        dispatch(setLoading(true));
        // Create the search string
        const searchString = createSearchString(
          q,
          city,
          county,
          company,
          remote,
          1
        );

        // Fetch the data
        const { jobs, total } = await getData(searchString);

        // Update the Redux state
        dispatch(clearJobs());
        dispatch(setJobs(jobs));
        dispatch(setTotal(total));
        updateUrlParams({ page: 1 });
      } catch (error) {
        // Handle any errors that occur during fetch
        console.error("Failed to fetch data:", error);
      } finally {
        // Ensure loading is set to false after data is fetched or an error occurs
        dispatch(setLoading(false));
      }
    };

    // Only fetch data if any of the query parameters are set
    if (
      q.length !== 0 ||
      city.length !== 0 ||
      remote.length !== 0 ||
      company.length !== 0
    ) {
      fetchData();
    } else {
      // Clear jobs and total if no query parameters are set
      dispatch(clearJobs());
      dispatch(setTotal(0));
    }
  }, [dispatch, q, city, remote, company, county, removeTag]);
  //new

  // remove text from input on X button.
  function handleClearX() {
    setText("");
    updateUrlParams({ q: null });
  }

  //function to remove diacritics
  const removeDiacritics = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // Function to filter cities based on input
  const filterCities = useCallback((input) => {
    // Use useCallback
    const normalizedInput = removeDiacritics(input.toLowerCase()); // Normalize input
    const filtered = orase.filter(
      (city) => removeDiacritics(city.toLowerCase()).includes(normalizedInput) // Normalize city names
    );
    setFilteredCities(filtered);
  }, []); // You might want to add dependencies here if orase changes

  // Update filtered cities when location input changes
  useEffect(() => {
    filterCities(locationn);
  }, [locationn, filterCities]); // Include filterCities in the dependency array

  // Close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFocusedInput(null); // Close the dropdown
      }
    };

    if (focusedInput) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [focusedInput]);

  // fetch job suggestion
  // Updated fetch logic with your provided async function
  const fetchData = async (text) => {
    try {
      const response = await getJobSuggestion(text); // Assuming getJobSuggestion is defined elsewhere
      setJobSuggestions(response.suggestions); // Update suggestions state with fetched data
      console.log(response.suggestions);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Aligning the h2 with the first card
  const [h2Width, setH2Width] = useState("auto");
  const calculateH2Width = () => {
    const screenWidth = window.innerWidth;
    const gap = 28;
    let cardWidth;
    const breakpoint = 1024;

    cardWidth = screenWidth > breakpoint ? 384 : 300;

    screenWidth >= 740 && screenWidth <= 767
      ? setH2Width(300)
      : setH2Width(
          (Math.floor((screenWidth - gap * 4 - cardWidth) / (cardWidth + gap)) +
            1) *
            cardWidth +
            (Math.floor(
              (screenWidth - gap * 4 - cardWidth) / (cardWidth + gap)
            ) +
              1 -
              1) *
              gap
        );
  };

  useEffect(() => {
    calculateH2Width();
    window.addEventListener("resize", calculateH2Width);
    return () => {
      window.removeEventListener("resize", calculateH2Width);
    };
  }, []);

  // Debouncing the fetch call
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text) {
        fetchData(text); // Call the updated fetch function
      } else {
        setJobSuggestions([]); // Reset suggestions if text is empty
      }
    }, 300); // Adjust debounce delay as needed

    return () => clearTimeout(timer); // Cleanup timeout if user continues typing
  }, [text]);
  return (
    <>
      <div>
        <div className="flex items-center justify-center mt-5  relative flex-col gap-2 lg:gap-0 lg:flex-row lg:h-[50px] ">
          {location.pathname === "/rezultate" && (
            <a href="/" className="logo mr-2">
              <img src={logo} alt="peviitor" />
            </a>
          )}
          <form
            onSubmit={handleUpdateQ}
            className="flex flex-col items-center   justify-between md:flex-row relative "
          >
            <div className="flex items-center justify-between  relative lg:w-[522px]  ">
              {/* Job Title Input */}
              <div
                className={`flex items-center  relative w-full border border-[#89969C] bg-white rounded-3xl ${
                  location.pathname !== "/"
                    ? "lg:border-r-2 border-[#89969C]" // border-ul pe dreapta se păstrează pe orice pagină, nu doar pe "/"
                    : "lg:border-r-0 lg:rounded-tr-none lg:rounded-br-none divider " // Adaugă divider doar pe paginile care nu sunt "/"
                } ${
                  focusedInput === "jobTitle" && location.pathname === "/"
                    ? "lg:border-b-[#eeeeee] lg:rounded-bl-none" // border-ul de jos doar pe pagina principală
                    : ""
                }`}
              >
                <LupeIcon className="w-5 h-5 text-gray-500 ml-3" />
                <input
                  type="text"
                  value={text} // Valoarea pentru căutare joburi
                  onChange={(e) => setText(e.target.value)}
                  onFocus={() => handleFocus("jobTitle")}
                  placeholder="Cauta un loc de munca"
                  className="w-full py-3 px-2 xl:pl-10 bg-transparent outline-none border-none focus:outline-none focus:ring-0"
                />
                {text && (
                  <XIcon
                    className="w-5 h-4 mr-4 fill-slate-500  cursor-pointer"
                    onClick={handleClearX}
                  />
                )}
              </div>

              {/* Dropdown for Job Title */}
              {location.pathname === "/" && focusedInput === "jobTitle" && (
                <ul className="hidden lg:block lg:absolute lg:left-0 lg:w-full lg:border lg:border-t-0 border-[#89969C] lg:rounded-3xl lg:rounded-t-none p-0  lg:mt-4 lg:max-h-48 lg:overflow-y-scroll custom-scrollbar lg:bottom-0 lg:transform lg:translate-y-full lg:box-border">
                  {}
                  {jobSuggestions &&
                    jobSuggestions.length > 0 &&
                    jobSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className={`px-12 py-2 cursor-pointer ${
                          index % 2 === 0 ? "bg-custom-gray" : "bg-white"
                        } hover:bg-gray-200`}
                        onMouseDown={() => {
                          setText(suggestion.term);
                          // Actualizează textul cu sugestia
                          setFocusedInput(null);
                          // Resetează focusedInput
                        }}
                      >
                        {suggestion.term}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Add Location Input */}
            <div ref={dropdownRef}>
              {" "}
              {/* Add ref to the container */}
              {location.pathname === "/" && (
                <div className="flex items-center justify-between  relative lg:w-[325px]">
                  <div
                    className={`flex items-center relative w-full border border-[#89969C]  rounded-3xl   lg:border-l-0 lg:rounded-tl-none lg:rounded-bl-none lg:rounded-tr-3xl bg-white  ${
                      focusedInput === "location"
                        ? "lg:border-b-[#eeeeee] lg:rounded-br-none"
                        : ""
                    }`}
                  >
                    <MapPinIcon className="w-7 h-7 text-gray-500 ml-3" />
                    <input
                      type="text"
                      value={locationn}
                      onChange={(e) => setLocation(e.target.value)}
                      onFocus={() => handleFocus("location")}
                      placeholder="Adauga o locatie"
                      className="w-full py-3 px-4 pl-2 bg-transparent outline-none border-none focus:outline-none focus:ring-0"
                    />
                    {locationn && (
                      <XIcon
                        className="w-5 h-4 fill-slate-500 mr-3 cursor-pointer"
                        onClick={handleClearLocation}
                      />
                    )}
                  </div>

                  {/* Add Location Input dropdown*/}
                  {focusedInput === "location" && (
                    <ul className="hidden lg:block lg:absolute lg:left-0 lg:w-full lg:border lg:border-t-0 lg:border-[#89969C] lg:rounded-3xl lg:rounded-t-none  lg:mt-4 lg:max-h-48 lg:overflow-y-scroll custom-scrollbar lg:bottom-0 lg:transform lg:translate-y-full lg:box-border">
                      {filteredCities.map((suggestion, index) => (
                        <li
                          key={index}
                          className={`px-12 py-2 cursor-pointer ${
                            index % 2 === 0 ? "bg-custom-gray" : "bg-white"
                          } hover:bg-gray-200`}
                          onClick={() => {
                            setLocation(suggestion);
                            setFocusedInput(null); // Close dropdown on selection
                          }}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            {/* button search */}
            <button
              type="submit"
              className="m-2 bg-background_green text-white w-[122px] h-[48px] text-base px-10  rounded-3xl transition duration-300 ease-out hover:shadow-button_shadow focus:outline-none"
            >
              Cauta
            </button>
          </form>
        </div>
        {/* // Conditionally render the checkboxes */}
        {location.pathname === "/rezultate" && <FiltreGrup />}
        {loading ? (
          <div className="h-[20px] w-[50%] md:w-[16%] mx-auto my-8 md:mx-0 bg-gray-300 animate-pulse rounded-md"></div>
        ) : (
          total > 0 && (
            <h2
              className="text-start text-text_grey_darker my-8 text-lg"
              style={{ width: h2Width, margin: "32px auto" }}
            >
              {total} {nrJoburi}
            </h2>
          )
        )}

        {!deletAll && total > 0 && (
          <div
            className="pb-9 flex gap-2 flex-wrap"
            style={{ width: h2Width, margin: "0 auto" }}
          >
            <FilterTags tags={fields} removeTag={removeTag} />
            <div className="flex gap-2 ml-4">
              <Button
                buttonType="deleteFilters"
                onClick={handleRemoveAllFilters}
              >
                Șterge filtre
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
export default Search;
