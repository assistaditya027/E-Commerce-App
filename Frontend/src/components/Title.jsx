const Title = ({ text1, text2 }) => {
  return (
    <div className="inline-flex gap-2 items-center mb-3">
      <p className="text-gray-500 dark:text-gray-400">
        {text1} <span className="text-gray-700 dark:text-gray-200 font-medium">{text2}</span>
      </p>
      <p className="w-8 sm:w-12 h-px sm:h-0.5 bg-gray-700 dark:bg-gray-500 "></p>
    </div>
  );
};

export default Title;
