# How To Contribute

We are thrilled that you are reading this since any willing developers who want to participate in the project will help it develop and engage a wider potential audience. Since HydroLang is intended to be an entirely open source framework that can be used in any research environment, the addition of any new features or enhancements to those that already exist will significantly enhance our vision.

We recognize and agree that a working knowledge of.git is necessary for code contributions. If you still want to contribute with a specific functionality, create an issue request with the functionality's name in the header, the algorithm if it's a steering function for the analyze module, and the functionality itself if it's a specific feature that enhances the maps or visualize module in the body. If you feel comfortable with .git, please follow the submitting changes and coding convention guidelines.

## TL;DR

    * If you want to add a functionality not included in the base code or any subsequent releases without usinh .git, please raise an issue with the functionality you would like to add.
    * Follow the code styles within any of the modules of the framework to get sense of how we like to format.
    * Share your insights based on our community guidelines and code of conduct.

## Submitting Changes
Send a Github Pull Request with a detailed list of your contributions. We would appreciate it if you could provide any examples of how the features you are adding might be used whenever you submit a request. Any new functionality and development must adhere to our code standards. Last but not least, make sure to include one feature each commit along with concise log statements. Larger commits must resemble the following:

    `
    $ git commit -m "Summary of the changes including large modules or functions.
    > some additional comment.
    > more information about the function"
    `

## Coding Conventions

Please read our code at any of the included modules to have a hang of it. We try to maintain consistency with ES5 for function definition in the main modules, and ES6 for the inner scope of each function. We optimize for readability and functionality in the following:
    * Each function should be written with the `params:{}, args:{}, data:[]` ontology, but not all options are required for to be used.We believe that parameter destructuring will work better when the project expands to include new features in the future. 
    * We indent using two spaces.
    * Please define any variables for your function using multiple variable definitions in the top part of the function (`const someVar, someVar2, someVar3; var myVar1, myVar2, myVar3;`).
    * We implement (JSDocs)[https://jsdoc.app/] syntax to produce straightforward and understandable documentation for each function. Please look at the definition of any variable to see the structure. Basic explanation with references if needed, function name, parameters, returns, and an example are the minimum requirements. 


