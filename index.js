#!/usr/bin/env node


const { program } = require("commander");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const { exec } = require("child_process");
const util = require("util");

const execPromise = util.promisify(exec);

const shadcnComponents = `npx shadcn add card button input select badge label textarea`;

const dependencies = {
  "vital-signs": "",
};

const componentsJsonFilePath = path.join(process.cwd(), "components.json");
const tailwindConfigFilePath = path.join(process.cwd(), "tailwind.config.ts");
const cssSourcePath = path.join(__dirname, "css/screen.css");

const packageComponentsPath = path.join(__dirname, "components");

const copyFile = async (sourcePath, destinationPath) => {
  try {
    const data = await fsPromises.readFile(sourcePath, "utf-8");
    await fsPromises.mkdir(path.dirname(destinationPath), { recursive: true });
    await fsPromises.writeFile(destinationPath, data);
    console.log(`File successfully copied to ${destinationPath}`);
  } catch (error) {
    throw new Error(
      `Error copying file from ${sourcePath} to ${destinationPath}: ${error.message}`,
    );
  }
};

const copyDirectoryRecursive = async (sourceDir, destinationDir) => {
  try {
    const items = await fsPromises.readdir(sourceDir, { withFileTypes: true });

    for (const item of items) {
      const sourcePath = path.join(sourceDir, item.name);
      const destinationPath = path.join(destinationDir, item.name);

      if (item.isDirectory()) {
        await copyDirectoryRecursive(sourcePath, destinationPath);
      } else {
        await copyFile(sourcePath, destinationPath);
      }
    }
  } catch (error) {
    throw new Error(
      `Error copying directory from ${sourceDir} to ${destinationDir}: ${error.message}`,
    );
  }
};

const copyComponent = async (destinationDir, componentName) => {
  const sourcePath = path.join(packageComponentsPath, `${componentName}.tsx`);
  const destinationFile = path.join(destinationDir, `${componentName}.tsx`);

  try {
    await copyFile(sourcePath, destinationFile);
    console.log(
      `Component ${componentName} successfully written to ${destinationFile}`,
    );
  } catch (error) {
    throw new Error(
      `Error copying component ${componentName}: ${error.message}`,
    );
  }
};

const copyVitalSignsStructure = async (destinationBaseDir) => {
  const vitalSignsSourcePath = path.join(
    __dirname,
    "components",
    "vital-signs",
  );
  const vitalSignsDestPath = path.join(destinationBaseDir, "vital-signs");

  console.log("Debug: Looking for vital signs at:", vitalSignsSourcePath);
  console.log("Debug: __dirname is:", __dirname);
  console.log("Debug: Destination will be:", vitalSignsDestPath);

  // Check if the vital-signs directory exists
  if (!fs.existsSync(vitalSignsSourcePath)) {
    console.error(
      `Vital signs directory not found at: ${vitalSignsSourcePath}`,
    );

    // Try to find the actual structure
    const alternativePath = path.join(__dirname, "components");
    console.log(
      "Debug: Checking if components directory exists:",
      fs.existsSync(alternativePath),
    );

    if (fs.existsSync(alternativePath)) {
      const items = await fsPromises.readdir(alternativePath);
      console.log("Debug: Items in components directory:", items);
    }

    throw new Error(
      `Vital signs directory not found at: ${vitalSignsSourcePath}`,
    );
  }

  try {
    // Copy the entire vital-signs folder structure
    await copyDirectoryRecursive(vitalSignsSourcePath, vitalSignsDestPath);
    console.log("Vital signs structure copied successfully");

    // Also copy the main vital-signs.tsx file if it exists
    const mainVitalSignsFile = path.join(
      __dirname,
      "components",
      "vital-signs.tsx",
    );
    if (fs.existsSync(mainVitalSignsFile)) {
      await copyFile(
        mainVitalSignsFile,
        path.join(destinationBaseDir, "vital-signs.tsx"),
      );
    }
  } catch (error) {
    throw new Error(`Error copying vital signs structure: ${error.message}`);
  }
};

const checkRequirements = async () => {
  let response = { isSuccess: false, componentRoute: "" };
  console.log(
    "checking existing config: components.json",
    fs.existsSync(componentsJsonFilePath),
    "tailwind config",
    fs.existsSync(tailwindConfigFilePath),
  );

  if (fs.existsSync(componentsJsonFilePath)) {
    try {
      const data = await fsPromises.readFile(componentsJsonFilePath, "utf-8");
      const components = JSON.parse(data);
      const componentRoute = path.join(
        process.cwd(),
        `${components.aliases.components.replace("@", "")}`,
      );
      return { ...response, isSuccess: true, componentRoute };
    } catch (err) {
      console.error("Error reading components file:", err);
      return response;
    }
  } else {
    console.log("Requirements not met");
    return response;
  }
};

const installDependencies = async (componentName) => {
  const deps = dependencies[componentName];
  if (deps) {
    console.log(`Installing dependencies for ${componentName}...`);
    const installCmd = `npm i ${deps}`;
    console.log("installCmd", installCmd);

    try {
      await execPromise(shadcnComponents, { cwd: process.cwd() });
      const { stdout, stderr } = await execPromise(installCmd, {
        cwd: process.cwd(),
      });
      console.log(`Installed ${componentName} dependencies successfully!`);
      console.log(stdout);
      if (stderr) {
        console.error(stderr);
      }
    } catch (error) {
      console.error(
        `Error installing dependencies for ${componentName}:`,
        error,
      );
      throw error;
    }
  } else {
    console.log(`No dependencies specified for ${componentName}`);
  }
};

program
  .command("add")
  .argument("<string>")
  .action(async (str) => {
    console.log(`Adding ${str}...`);
    console.log("Debug: Current working directory:", process.cwd());
    console.log("Debug: __dirname:", __dirname);

    const { isSuccess, componentRoute } = await checkRequirements();

    if (!isSuccess) {
      console.log("Requirements not met...");
      process.exit(1);
    }

    console.log("Debug: Component route:", componentRoute);

    try {
      if (str === "vital-signs") {
        // Copy the entire vital signs structure
        await copyVitalSignsStructure(componentRoute);
        await installDependencies(str);
      } else {
        // Copy single component
        await copyComponent(componentRoute, str);
        await installDependencies(str);
      }

      console.log(`Successfully added ${str}!`);
      process.exit(0);
    } catch (error) {
      console.error("Error during add command:", error);
      process.exit(1);
    }
  });

// New command to list available vital signs components
program.command("list-vital-signs").action(async () => {
  const vitalSignsPath = path.join(__dirname, "components", "vital-signs");

  try {
    if (fs.existsSync(vitalSignsPath)) {
      const items = await fsPromises.readdir(vitalSignsPath, {
        withFileTypes: true,
      });
      console.log("Available vital signs components:");

      items.forEach((item) => {
        if (item.isDirectory()) {
          console.log(`  📁 ${item.name}/`);
        } else if (item.name.endsWith(".tsx") || item.name.endsWith(".ts")) {
          console.log(`  📄 ${item.name}`);
        }
      });
    } else {
      console.log("No vital signs components found");
    }
  } catch (error) {
    console.error("Error listing vital signs components:", error);
  }
});

// Debug command to help troubleshoot
program.command("debug").action(async () => {
  console.log("=== DEBUG INFO ===");
  console.log("Current working directory:", process.cwd());
  console.log("__dirname:", __dirname);
  console.log("Package components path:", packageComponentsPath);

  const { isSuccess, componentRoute } = await checkRequirements();
  console.log("Requirements check:", { isSuccess, componentRoute });

  console.log("\n=== CHECKING DIRECTORIES ===");
  const componentsDir = path.join(__dirname, "components");
  console.log("Components directory exists:", fs.existsSync(componentsDir));

  if (fs.existsSync(componentsDir)) {
    const items = await fsPromises.readdir(componentsDir);
    console.log("Items in components directory:", items);

    // Check for vital-signs specifically
    const vitalSignsPath = path.join(componentsDir, "vital-signs");
    console.log("Vital signs directory exists:", fs.existsSync(vitalSignsPath));

    if (fs.existsSync(vitalSignsPath)) {
      const vitalSignsItems = await fsPromises.readdir(vitalSignsPath);
      console.log("Items in vital-signs directory:", vitalSignsItems);
    }
  }

  console.log("\n=== CURRENT DIRECTORY STRUCTURE ===");
  try {
    const currentItems = await fsPromises.readdir(process.cwd());
    console.log("Items in current directory:", currentItems);
  } catch (error) {
    console.error("Error reading current directory:", error);
  }
});

program.parse();
