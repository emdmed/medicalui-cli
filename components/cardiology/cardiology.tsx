/**
 * CardiologyCalculator — Tab wrapper for 3 cardiology risk calculators.
 *
 * @props  None — fully self-contained, no external data flow.
 *
 * @usage
 *   <CardiologyCalculator />
 *
 * @behavior
 *   Tabs: ASCVD | HEART | CHA₂DS₂-VASc.
 *   Each tab renders a self-contained calculator with click-to-edit and inline results.
 */
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ASCVDCalculator from "./components/ascvd-calculator";
import HEARTScoreCalculator from "./components/heart-score-calculator";
import CHADSVAScCalculator from "./components/chadsvasc-calculator";

const CardiologyCalculator = () => {
  return (
    <div className="w-fit mx-auto">
      <Tabs defaultValue="ascvd" className="w-[340px]">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ascvd">ASCVD</TabsTrigger>
          <TabsTrigger value="heart">HEART</TabsTrigger>
          <TabsTrigger value="chadsvasc">CHA₂DS₂-VASc</TabsTrigger>
        </TabsList>
        <TabsContent value="ascvd">
          <ASCVDCalculator />
        </TabsContent>
        <TabsContent value="heart">
          <HEARTScoreCalculator />
        </TabsContent>
        <TabsContent value="chadsvasc">
          <CHADSVAScCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CardiologyCalculator;
