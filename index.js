#!/usr/bin/env node

const { program } = require("commander");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const { exec } = require("child_process");
const util = require("util");

const execPromise = util.promisify(exec);

const shadcnComponents = `npx shadcn add card button input select badge label textarea`;

// Additional npm dependencies needed for specific components
// Shadcn components (card, button, input, etc.) are installed automatically for all components
const dependencies = {
  "vital-signs": "", // No additional dependencies needed
  "acid-base": "", // No additional dependencies needed
  // Add more components here with their specific npm dependencies if needed
  // Example: "chart-component": "recharts d3"
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
  try {
    // Always install shadcn components first
    console.log("Installing required shadcn components...");
    const { stdout: shadcnStdout, stderr: shadcnStderr } = await execPromise(
      shadcnComponents,
      { cwd: process.cwd() }
    );
    console.log("Shadcn components installed successfully!");
    if (shadcnStdout) console.log(shadcnStdout);
    if (shadcnStderr) console.error(shadcnStderr);

    // Then install component-specific dependencies if they exist
    const deps = dependencies[componentName];
    if (deps && deps.trim() !== "") {
      console.log(`Installing additional dependencies for ${componentName}...`);
      const installCmd = `npm i ${deps}`;
      console.log("installCmd", installCmd);

      const { stdout, stderr } = await execPromise(installCmd, {
        cwd: process.cwd(),
      });
      console.log(`Installed ${componentName} dependencies successfully!`);
      console.log(stdout);
      if (stderr) {
        console.error(stderr);
      }
    } else {
      console.log(`No additional dependencies for ${componentName}`);
    }
  } catch (error) {
    console.error(
      `Error installing dependencies for ${componentName}:`,
      error
    );
    throw error;
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
      // Check if component is a folder or a file
      const componentFolderPath = path.join(packageComponentsPath, str);
      const componentFilePath = path.join(packageComponentsPath, `${str}.tsx`);

      if (fs.existsSync(componentFolderPath) && fs.statSync(componentFolderPath).isDirectory()) {
        // Component is a folder - copy entire directory structure
        console.log(`Copying folder component: ${str}`);
        const destinationPath = path.join(componentRoute, str);
        await copyDirectoryRecursive(componentFolderPath, destinationPath);
        console.log(`Folder component ${str} successfully copied to ${destinationPath}`);
      } else if (fs.existsSync(componentFilePath)) {
        // Component is a single file - copy the file
        console.log(`Copying file component: ${str}`);
        await copyComponent(componentRoute, str);
      } else {
        throw new Error(`Component "${str}" not found as either a folder or file in ${packageComponentsPath}`);
      }

      await installDependencies(str);
      console.log(`Successfully added ${str}!`);
      process.exit(0);
    } catch (error) {
      console.error("Error during add command:", error);
      process.exit(1);
    }
  });

// Command to list all available components
program.command("list").action(async () => {
  const componentsPath = path.join(__dirname, "components");

  try {
    if (fs.existsSync(componentsPath)) {
      const items = await fsPromises.readdir(componentsPath, {
        withFileTypes: true,
      });
      console.log("Available components:");

      items.forEach((item) => {
        if (item.isDirectory()) {
          console.log(`  📁 ${item.name}/ (folder component)`);
        } else if (item.name.endsWith(".tsx") || item.name.endsWith(".ts")) {
          const componentName = item.name.replace(/\.(tsx|ts)$/, "");
          console.log(`  📄 ${componentName} (file component)`);
        }
      });
    } else {
      console.log("No components found");
    }
  } catch (error) {
    console.error("Error listing components:", error);
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
    const items = await fsPromises.readdir(componentsDir, {
      withFileTypes: true,
    });
    console.log("Items in components directory:");
    items.forEach((item) => {
      const type = item.isDirectory() ? "DIR" : "FILE";
      console.log(`  [${type}] ${item.name}`);
    });

    // Check for specific folder components
    const folderComponents = ["vital-signs", "acid-base"];
    for (const folderName of folderComponents) {
      const folderPath = path.join(componentsDir, folderName);
      console.log(
        `\n${folderName} directory exists:`,
        fs.existsSync(folderPath),
      );

      if (fs.existsSync(folderPath)) {
        const folderItems = await fsPromises.readdir(folderPath);
        console.log(`Items in ${folderName} directory:`, folderItems);
      }
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
