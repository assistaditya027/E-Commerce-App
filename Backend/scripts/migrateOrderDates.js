import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/mongodb.js';
import orderModel from '../models/orderModel.js';

const DRY_RUN = process.argv.includes('--dry-run');

const migrate = async () => {
  await connectDB();

  if (DRY_RUN) {
    const [dateCount, historyCount] = await Promise.all([
      orderModel.countDocuments({ date: { $type: 'number' } }),
      orderModel.countDocuments({ 'statusHistory.at': { $type: 'number' } }),
    ]);

    console.log(
      `[migrateOrderDates] dryRun=true dateCount=${dateCount} historyCount=${historyCount}`,
    );
    await mongoose.disconnect();
    return;
  }

  const dateResult = await orderModel.collection.updateMany({ date: { $type: 'number' } }, [
    { $set: { date: { $toDate: '$date' } } },
  ]);

  const historyResult = await orderModel.collection.updateMany(
    { 'statusHistory.at': { $type: 'number' } },
    [
      {
        $set: {
          statusHistory: {
            $map: {
              input: '$statusHistory',
              as: 'h',
              in: {
                $mergeObjects: [
                  '$$h',
                  {
                    at: {
                      $cond: [
                        { $eq: [{ $type: '$$h.at' }, 'number'] },
                        { $toDate: '$$h.at' },
                        '$$h.at',
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ],
  );

  console.log(
    `[migrateOrderDates] updatedDates=${dateResult.modifiedCount} updatedHistory=${historyResult.modifiedCount}`,
  );
  await mongoose.disconnect();
};

migrate().catch(async (err) => {
  console.error('[migrateOrderDates] failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // Ignore disconnect errors
  }
  process.exit(1);
});
