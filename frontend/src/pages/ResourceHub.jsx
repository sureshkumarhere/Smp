import React from "react";

const ResourceHub = () => {
  const cardValue = [
    "Official Clubs",
    "Some Important Things",
    "Internships",
    "Paid Courses Links",
    "Sem 1",
    "Sem 2",
    "Sem 3",
    "Sem 4",
    "Sem 5",
    "Sem 6",
    "TPO",
  ];

  const cardLinks = [
    "https://drive.google.com/drive/folders/16EaSwLGfuvusA20ZxaD9qw_KsvHMWTFC",
    "https://drive.google.com/drive/folders/1si_RIxS1KRMma_jduy3Xa43xJ4Nd5Mw-",
    "https://drive.google.com/drive/folders/1ejqM2HE-xHvDYc5CuxWLwPcG9S5G5PlQ",
    "https://drive.google.com/drive/folders/1LR1dSjF_4xF892tZp8IE2DlQ19uqGSpq",
    "https://drive.google.com/drive/folders/1s_A6sPqmFHFnqkUNiC8USBSlHp3frtIW",
    "https://drive.google.com/drive/folders/1OXiz6UNEidjslTAV41KNYv9cKlCykY_D",
    "https://drive.google.com/drive/folders/1BBCBvg3pMO3z-lKoXGFbMoMNtlY1Mkei",
    "https://drive.google.com/drive/folders/1eapB2UG1qrkfZ_A6Ldvi7LVruLMdC7DW",
    "https://drive.google.com/drive/folders/13fjchahlO69JmD0CVzNsWOd4LE0l-S83",
    "https://drive.google.com/drive/folders/1BbmN4W5QY9oisZpH8iTENVuIKQoJLuwk",
    "https://drive.google.com/drive/folders/1Nv1gZuIYcjr1PeUivRug83jzX2Sc50w0",
  ];

  // Function to generate a random background color
  const getRandomColor = () => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-gray-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-cyan-500",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
    };
    
    const handleClick = () => {
        window.open("https://mnnit-smp.github.io/SMP_ResourceHub/", "_blank");
    }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
          <h1 className="text-3xl font-bold text-center mb-6">📚 Resource Hub <button className="bg-black text-white rounded-2xl p-0.5"  onClick={handleClick}> go to 2023 version</button></h1>
          
         
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {cardValue.map((title, index) => (
          <div
            key={index}
            className={`p-6 text-white rounded-2xl shadow-lg cursor-pointer transition transform hover:scale-105 ${getRandomColor()}`}
            onClick={() => window.open(cardLinks[index], "_blank")}
          >
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceHub;
